"""add_loyalty_and_coupons

Revision ID: cea4319df325
Revises: 06cf3a0fe7b1
Create Date: 2026-07-18 00:32:05.521656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cea4319df325'
down_revision: Union[str, Sequence[str], None] = '06cf3a0fe7b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add loyalty_points column to customers
    op.add_column('customers', sa.Column('loyalty_points', sa.Integer(), nullable=False, server_default='0'))

    # Create coupons table
    op.create_table(
        'coupons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=30), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('discount_type', sa.String(length=20), nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('min_order_amount', sa.Numeric(precision=10, scale=2), server_default='0', nullable=True),
        sa.Column('max_discount_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('usage_limit_total', sa.Integer(), nullable=True),
        sa.Column('usage_limit_per_user', sa.Integer(), server_default='1', nullable=True),
        sa.Column('valid_from', sa.DateTime(), nullable=False),
        sa.Column('valid_until', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_by_staff_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by_staff_id'], ['staff.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_coupons_code'), 'coupons', ['code'], unique=True)
    op.create_index(op.f('ix_coupons_id'), 'coupons', ['id'], unique=False)

    # Create loyalty_transactions table
    op.create_table(
        'loyalty_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('points_change', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=30), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_loyalty_transactions_id'), 'loyalty_transactions', ['id'], unique=False)

    # Create coupon_usage table
    op.create_table(
        'coupon_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('coupon_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('discount_applied', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('used_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['coupon_id'], ['coupons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_coupon_usage_id'), 'coupon_usage', ['id'], unique=False)

    # Add coupon_id, discount_amount, points_redeemed, points_earned columns to orders
    op.add_column('orders', sa.Column('coupon_id', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), server_default='0', nullable=True))
    op.add_column('orders', sa.Column('points_redeemed', sa.Integer(), server_default='0', nullable=True))
    op.add_column('orders', sa.Column('points_earned', sa.Integer(), server_default='0', nullable=True))
    op.create_foreign_key('fk_orders_coupon_id', 'orders', 'coupons', ['coupon_id'], ['id'])

    # Replace decrement_stock_on_confirm trigger function to support loyalty points earned and refunded/reversed
    op.execute("""
    CREATE OR REPLACE FUNCTION decrement_stock_on_confirm()
    RETURNS TRIGGER AS $$
    DECLARE
        curr_bal INTEGER;
    BEGIN
        -- On transition to confirmed:
        IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
            -- Decrement product stock
            UPDATE products p
            SET stock_qty = p.stock_qty - oi.quantity
            FROM order_items oi
            WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

            -- Insert into inventory_log
            INSERT INTO inventory_log (product_id, change_qty, reason, order_id)
            SELECT product_id, -quantity, 'order', NEW.id
            FROM order_items WHERE order_id = NEW.id;

            -- Award loyalty points earned
            IF NEW.points_earned > 0 THEN
                UPDATE customers
                SET loyalty_points = loyalty_points + NEW.points_earned
                WHERE id = NEW.customer_id;

                SELECT loyalty_points INTO curr_bal FROM customers WHERE id = NEW.customer_id;

                INSERT INTO loyalty_transactions (customer_id, order_id, points_change, reason, balance_after)
                VALUES (NEW.customer_id, NEW.id, NEW.points_earned, 'earned', curr_bal);
            END IF;
        END IF;

        -- On transition to cancelled from confirmed, reverse earned points:
        IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
            IF OLD.points_earned > 0 THEN
                UPDATE customers
                SET loyalty_points = GREATEST(0, loyalty_points - OLD.points_earned)
                WHERE id = NEW.customer_id;

                SELECT loyalty_points INTO curr_bal FROM customers WHERE id = NEW.customer_id;

                INSERT INTO loyalty_transactions (customer_id, order_id, points_change, reason, balance_after)
                VALUES (NEW.customer_id, NEW.id, -OLD.points_earned, 'expired', curr_bal);
            END IF;
        END IF;

        -- On transition to cancelled, refund points redeemed:
        IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            IF OLD.points_redeemed > 0 THEN
                UPDATE customers
                SET loyalty_points = loyalty_points + OLD.points_redeemed
                WHERE id = NEW.customer_id;

                SELECT loyalty_points INTO curr_bal FROM customers WHERE id = NEW.customer_id;

                INSERT INTO loyalty_transactions (customer_id, order_id, points_change, reason, balance_after)
                VALUES (NEW.customer_id, NEW.id, OLD.points_redeemed, 'admin_adjustment', curr_bal);
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Revert trigger function to original
    op.execute("""
    CREATE OR REPLACE FUNCTION decrement_stock_on_confirm()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
            UPDATE products p
            SET stock_qty = p.stock_qty - oi.quantity
            FROM order_items oi
            WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

            INSERT INTO inventory_log (product_id, change_qty, reason, order_id)
            SELECT product_id, -quantity, 'order', NEW.id
            FROM order_items WHERE order_id = NEW.id;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # Drop columns and tables
    op.drop_constraint('fk_orders_coupon_id', 'orders', type_='foreignkey')
    op.drop_column('orders', 'points_earned')
    op.drop_column('orders', 'points_redeemed')
    op.drop_column('orders', 'discount_amount')
    op.drop_column('orders', 'coupon_id')

    op.drop_index(op.f('ix_coupon_usage_id'), table_name='coupon_usage')
    op.drop_table('coupon_usage')

    op.drop_index(op.f('ix_loyalty_transactions_id'), table_name='loyalty_transactions')
    op.drop_table('loyalty_transactions')

    op.drop_index(op.f('ix_coupons_id'), table_name='coupons')
    op.drop_index(op.f('ix_coupons_code'), table_name='coupons')
    op.drop_table('coupons')

    op.drop_column('customers', 'loyalty_points')
