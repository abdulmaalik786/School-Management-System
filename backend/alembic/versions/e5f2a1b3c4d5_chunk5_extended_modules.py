"""chunk5_extended_modules

Revision ID: e5f2a1b3c4d5
Revises: d4e1f2a3b4c5
Create Date: 2026-08-28 19:38:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f2a1b3c4d5'
down_revision: Union[str, None] = 'd4e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Assignments Table
    op.create_table(
        'assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('max_marks', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('attachment_url', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['class_id'], ['school_classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assignments_id'), 'assignments', ['id'], unique=False)
    op.create_index(op.f('ix_assignments_due_date'), 'assignments', ['due_date'], unique=False)

    # 2. Assignment Submissions Table
    op.create_table(
        'assignment_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('submission_text', sa.Text(), nullable=True),
        sa.Column('attachment_url', sa.String(length=255), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('marks_obtained', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='Submitted', nullable=False),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('graded_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['graded_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student_submission')
    )
    op.create_index(op.f('ix_assignment_submissions_id'), 'assignment_submissions', ['id'], unique=False)
    op.create_index(op.f('ix_assignment_submissions_assignment_id'), 'assignment_submissions', ['assignment_id'], unique=False)
    op.create_index(op.f('ix_assignment_submissions_student_id'), 'assignment_submissions', ['student_id'], unique=False)

    # 3. Books Table
    op.create_table(
        'books',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('author', sa.String(length=100), nullable=False),
        sa.Column('isbn', sa.String(length=50), nullable=True),
        sa.Column('category', sa.String(length=50), server_default='General', nullable=False),
        sa.Column('publisher', sa.String(length=100), nullable=True),
        sa.Column('rack_number', sa.String(length=30), nullable=True),
        sa.Column('total_copies', sa.Integer(), server_default='1', nullable=False),
        sa.Column('available_copies', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_books_id'), 'books', ['id'], unique=False)
    op.create_index(op.f('ix_books_title'), 'books', ['title'], unique=False)
    op.create_index(op.f('ix_books_author'), 'books', ['author'], unique=False)
    op.create_index(op.f('ix_books_isbn'), 'books', ['isbn'], unique=True)
    op.create_index(op.f('ix_books_category'), 'books', ['category'], unique=False)

    # 4. Book Issues Table
    op.create_table(
        'book_issues',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('book_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('issue_date', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('return_date', sa.Date(), nullable=True),
        sa.Column('fine_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='Issued', nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('issued_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['issued_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_book_issues_id'), 'book_issues', ['id'], unique=False)
    op.create_index(op.f('ix_book_issues_book_id'), 'book_issues', ['book_id'], unique=False)
    op.create_index(op.f('ix_book_issues_status'), 'book_issues', ['status'], unique=False)

    # 5. Vehicles Table
    op.create_table(
        'vehicles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vehicle_number', sa.String(length=50), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('capacity', sa.Integer(), server_default='30', nullable=False),
        sa.Column('driver_name', sa.String(length=100), nullable=True),
        sa.Column('driver_phone', sa.String(length=30), nullable=True),
        sa.Column('license_number', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='Active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vehicles_id'), 'vehicles', ['id'], unique=False)
    op.create_index(op.f('ix_vehicles_vehicle_number'), 'vehicles', ['vehicle_number'], unique=True)

    # 6. Transport Routes Table
    op.create_table(
        'transport_routes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('route_name', sa.String(length=100), nullable=False),
        sa.Column('start_point', sa.String(length=100), nullable=False),
        sa.Column('end_point', sa.String(length=100), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=True),
        sa.Column('fare_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transport_routes_id'), 'transport_routes', ['id'], unique=False)

    # 7. Route Stops Table
    op.create_table(
        'route_stops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('route_id', sa.Integer(), nullable=False),
        sa.Column('stop_name', sa.String(length=100), nullable=False),
        sa.Column('pickup_time', sa.String(length=20), nullable=True),
        sa.Column('drop_time', sa.String(length=20), nullable=True),
        sa.Column('stop_order', sa.Integer(), server_default='1', nullable=False),
        sa.Column('stop_fee', sa.Float(), server_default='0.0', nullable=False),
        sa.ForeignKeyConstraint(['route_id'], ['transport_routes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_route_stops_id'), 'route_stops', ['id'], unique=False)
    op.create_index(op.f('ix_route_stops_route_id'), 'route_stops', ['route_id'], unique=False)

    # 8. Student Transports Table
    op.create_table(
        'student_transports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('route_id', sa.Integer(), nullable=False),
        sa.Column('stop_id', sa.Integer(), nullable=True),
        sa.Column('academic_year_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='Active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['route_id'], ['transport_routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stop_id'], ['route_stops.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['academic_year_id'], ['academic_years.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'academic_year_id', name='uq_student_academic_transport')
    )
    op.create_index(op.f('ix_student_transports_id'), 'student_transports', ['id'], unique=False)

    # 9. School Events Table
    op.create_table(
        'school_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('audience', sa.String(length=50), server_default='All', nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_school_events_id'), 'school_events', ['id'], unique=False)
    op.create_index(op.f('ix_school_events_start_date'), 'school_events', ['start_date'], unique=False)

    # 10. Announcements Table
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), server_default='General', nullable=False),
        sa.Column('target_role', sa.String(length=50), server_default='All', nullable=False),
        sa.Column('is_pinned', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_announcements_id'), 'announcements', ['id'], unique=False)

    # 11. Notifications Table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('link', sa.String(length=255), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # 12. School Settings Table
    op.create_table(
        'school_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), server_default='General', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_school_settings_id'), 'school_settings', ['id'], unique=False)
    op.create_index(op.f('ix_school_settings_key'), 'school_settings', ['key'], unique=True)


def downgrade() -> None:
    op.drop_table('school_settings')
    op.drop_table('notifications')
    op.drop_table('announcements')
    op.drop_table('school_events')
    op.drop_table('student_transports')
    op.drop_table('route_stops')
    op.drop_table('transport_routes')
    op.drop_table('vehicles')
    op.drop_table('book_issues')
    op.drop_table('books')
    op.drop_table('assignment_submissions')
    op.drop_table('assignments')
