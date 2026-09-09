"""chunk4_exams_fees

Revision ID: d4e1f2a3b4c5
Revises: 0c13d96f46b2
Create Date: 2026-08-28 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e1f2a3b4c5'
down_revision: Union[str, None] = '0c13d96f46b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Exams Table
    op.create_table(
        'exams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('exam_type', sa.String(length=50), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('exam_date', sa.Date(), nullable=False),
        sa.Column('total_marks', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('passing_marks', sa.Float(), nullable=False, server_default='40.0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['school_classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exams_id'), 'exams', ['id'], unique=False)
    op.create_index(op.f('ix_exams_exam_date'), 'exams', ['exam_date'], unique=False)

    # 2. Exam Marks Table
    op.create_table(
        'exam_marks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('marks_obtained', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('is_absent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('recorded_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('exam_id', 'student_id', name='uq_exam_student_mark')
    )
    op.create_index(op.f('ix_exam_marks_id'), 'exam_marks', ['id'], unique=False)
    op.create_index(op.f('ix_exam_marks_exam_id'), 'exam_marks', ['exam_id'], unique=False)
    op.create_index(op.f('ix_exam_marks_student_id'), 'exam_marks', ['student_id'], unique=False)

    # 3. Fee Structures Table
    op.create_table(
        'fee_structures',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('fee_type', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('frequency', sa.String(length=30), nullable=False, server_default='Monthly'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['school_classes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('academic_year_id', 'class_id', 'fee_type', name='uq_fee_structure_class_type')
    )
    op.create_index(op.f('ix_fee_structures_id'), 'fee_structures', ['id'], unique=False)

    # 4. Fee Invoices Table
    op.create_table(
        'fee_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('fee_month', sa.String(length=30), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('subtotal_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('discount_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('fine_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('paid_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('remaining_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Pending'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fee_invoices_id'), 'fee_invoices', ['id'], unique=False)
    op.create_index(op.f('ix_fee_invoices_invoice_number'), 'fee_invoices', ['invoice_number'], unique=True)
    op.create_index(op.f('ix_fee_invoices_student_id'), 'fee_invoices', ['student_id'], unique=False)
    op.create_index(op.f('ix_fee_invoices_status'), 'fee_invoices', ['status'], unique=False)

    # 5. Fee Invoice Items Table
    op.create_table(
        'fee_invoice_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('fee_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.ForeignKeyConstraint(['invoice_id'], ['fee_invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fee_invoice_items_id'), 'fee_invoice_items', ['id'], unique=False)
    op.create_index(op.f('ix_fee_invoice_items_invoice_id'), 'fee_invoice_items', ['invoice_id'], unique=False)

    # 6. Fee Payments Table
    op.create_table(
        'fee_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('receipt_number', sa.String(length=50), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('amount_paid', sa.Float(), nullable=False),
        sa.Column('discount_applied', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('fine_applied', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('payment_method', sa.String(length=30), nullable=False, server_default='Cash'),
        sa.Column('transaction_reference', sa.String(length=100), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('recorded_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['fee_invoices.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recorded_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fee_payments_id'), 'fee_payments', ['id'], unique=False)
    op.create_index(op.f('ix_fee_payments_receipt_number'), 'fee_payments', ['receipt_number'], unique=True)
    op.create_index(op.f('ix_fee_payments_invoice_id'), 'fee_payments', ['invoice_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_fee_payments_invoice_id'), table_name='fee_payments')
    op.drop_index(op.f('ix_fee_payments_receipt_number'), table_name='fee_payments')
    op.drop_index(op.f('ix_fee_payments_id'), table_name='fee_payments')
    op.drop_table('fee_payments')

    op.drop_index(op.f('ix_fee_invoice_items_invoice_id'), table_name='fee_invoice_items')
    op.drop_index(op.f('ix_fee_invoice_items_id'), table_name='fee_invoice_items')
    op.drop_table('fee_invoice_items')

    op.drop_index(op.f('ix_fee_invoices_status'), table_name='fee_invoices')
    op.drop_index(op.f('ix_fee_invoices_student_id'), table_name='fee_invoices')
    op.drop_index(op.f('ix_fee_invoices_invoice_number'), table_name='fee_invoices')
    op.drop_index(op.f('ix_fee_invoices_id'), table_name='fee_invoices')
    op.drop_table('fee_invoices')

    op.drop_index(op.f('ix_fee_structures_id'), table_name='fee_structures')
    op.drop_table('fee_structures')

    op.drop_index(op.f('ix_exam_marks_student_id'), table_name='exam_marks')
    op.drop_index(op.f('ix_exam_marks_exam_id'), table_name='exam_marks')
    op.drop_index(op.f('ix_exam_marks_id'), table_name='exam_marks')
    op.drop_table('exam_marks')

    op.drop_index(op.f('ix_exams_exam_date'), table_name='exams')
    op.drop_index(op.f('ix_exams_id'), table_name='exams')
    op.drop_table('exams')
