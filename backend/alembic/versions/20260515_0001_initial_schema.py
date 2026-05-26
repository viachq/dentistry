"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE userrole AS ENUM ('patient', 'doctor', 'admin');
        CREATE TYPE appointmentstatus AS ENUM ('new', 'confirmed', 'completed', 'cancelled', 'no_show');
        CREATE TYPE paymentmethod AS ENUM ('online', 'offline');
        CREATE TYPE paymentstatus AS ENUM ('pending', 'paid', 'failed', 'refunded');
        CREATE TYPE notificationtype AS ENUM (
            'new_appointment', 'appointment_confirmed', 'appointment_completed',
            'appointment_cancelled', 'appointment_no_show'
        );
        CREATE TYPE promocodetype AS ENUM ('percent', 'fixed');

        CREATE TABLE "user" (
            id          SERIAL PRIMARY KEY,
            username    VARCHAR(50)  NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            full_name   VARCHAR(120) NOT NULL,
            phone       VARCHAR(32),
            email       VARCHAR(255),
            role        userrole     NOT NULL,
            is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ  DEFAULT now(),
            updated_at  TIMESTAMPTZ  DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_user_username ON "user" (username);
        CREATE        INDEX ix_user_role     ON "user" (role);

        CREATE TABLE doctorprofile (
            id                 SERIAL PRIMARY KEY,
            user_id            INTEGER      NOT NULL REFERENCES "user"(id),
            birth_date         DATE,
            title              VARCHAR(80)  NOT NULL DEFAULT 'Dentist',
            rating             FLOAT        NOT NULL DEFAULT 0,
            photo_path         VARCHAR(255),
            bio                TEXT,
            commission_percent FLOAT,
            fixed_payout       FLOAT,
            created_at         TIMESTAMPTZ  DEFAULT now(),
            updated_at         TIMESTAMPTZ  DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_doctorprofile_user_id ON doctorprofile (user_id);

        CREATE TABLE service (
            id               SERIAL PRIMARY KEY,
            name             VARCHAR(120) NOT NULL,
            description      VARCHAR(255),
            duration_minutes INTEGER      NOT NULL,
            price            FLOAT        NOT NULL,
            is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at       TIMESTAMPTZ  DEFAULT now(),
            updated_at       TIMESTAMPTZ  DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_service_name ON service (name);

        CREATE TABLE doctorservice (
            id           SERIAL PRIMARY KEY,
            doctor_id    INTEGER NOT NULL REFERENCES doctorprofile(id),
            service_id   INTEGER NOT NULL REFERENCES service(id),
            custom_price FLOAT,
            created_at   TIMESTAMPTZ DEFAULT now(),
            updated_at   TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE workschedule (
            id          SERIAL PRIMARY KEY,
            doctor_id   INTEGER NOT NULL REFERENCES doctorprofile(id),
            weekday     INTEGER NOT NULL,
            start_time  TIME    NOT NULL,
            end_time    TIME    NOT NULL,
            break_start TIME,
            break_end   TIME,
            created_at  TIMESTAMPTZ DEFAULT now(),
            updated_at  TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE scheduleexception (
            id             SERIAL PRIMARY KEY,
            doctor_id      INTEGER NOT NULL REFERENCES doctorprofile(id),
            exception_date DATE    NOT NULL,
            is_day_off     BOOLEAN NOT NULL DEFAULT FALSE,
            start_time     TIME,
            end_time       TIME,
            reason         VARCHAR(255),
            created_at     TIMESTAMPTZ DEFAULT now(),
            updated_at     TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX ix_scheduleexception_exception_date ON scheduleexception (exception_date);

        CREATE TABLE promocode (
            id             SERIAL PRIMARY KEY,
            code           VARCHAR(40)   NOT NULL,
            discount_type  promocodetype NOT NULL,
            discount_value FLOAT         NOT NULL,
            expires_at     DATE,
            usage_limit    INTEGER,
            is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
            created_at     TIMESTAMPTZ   DEFAULT now(),
            updated_at     TIMESTAMPTZ   DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_promocode_code ON promocode (code);

        CREATE TABLE appointment (
            id              SERIAL PRIMARY KEY,
            patient_id      INTEGER           NOT NULL REFERENCES "user"(id),
            doctor_id       INTEGER           NOT NULL REFERENCES doctorprofile(id),
            service_id      INTEGER           NOT NULL REFERENCES service(id),
            promo_code_id   INTEGER           REFERENCES promocode(id),
            starts_at       TIMESTAMPTZ       NOT NULL,
            ends_at         TIMESTAMPTZ       NOT NULL,
            discount_amount FLOAT             NOT NULL DEFAULT 0,
            status          appointmentstatus NOT NULL DEFAULT 'new',
            notes           VARCHAR(255),
            created_at      TIMESTAMPTZ       DEFAULT now(),
            updated_at      TIMESTAMPTZ       DEFAULT now()
        );
        CREATE INDEX ix_appointment_starts_at ON appointment (starts_at);

        CREATE TABLE payment (
            id                 SERIAL PRIMARY KEY,
            appointment_id     INTEGER       NOT NULL REFERENCES appointment(id),
            amount             FLOAT         NOT NULL,
            method             paymentmethod NOT NULL,
            status             paymentstatus NOT NULL DEFAULT 'pending',
            provider_reference VARCHAR(120),
            created_at         TIMESTAMPTZ   DEFAULT now(),
            updated_at         TIMESTAMPTZ   DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_payment_appointment_id ON payment (appointment_id);

        CREATE TABLE review (
            id                SERIAL PRIMARY KEY,
            appointment_id    INTEGER      NOT NULL REFERENCES appointment(id),
            doctor_id         INTEGER      NOT NULL REFERENCES doctorprofile(id),
            patient_id        INTEGER      NOT NULL REFERENCES "user"(id),
            rating            INTEGER      NOT NULL,
            comment           TEXT,
            moderation_status VARCHAR(30)  NOT NULL DEFAULT 'pending',
            created_at        TIMESTAMPTZ  DEFAULT now(),
            updated_at        TIMESTAMPTZ  DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_review_appointment_id ON review (appointment_id);

        CREATE TABLE expense (
            id           SERIAL PRIMARY KEY,
            category     VARCHAR(80) NOT NULL,
            amount       FLOAT       NOT NULL,
            expense_date DATE        NOT NULL,
            description  TEXT,
            created_at   TIMESTAMPTZ DEFAULT now(),
            updated_at   TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE expense_category (
            id         SERIAL PRIMARY KEY,
            name       VARCHAR(80) NOT NULL,
            is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_expense_category_name ON expense_category (name);

        CREATE TABLE notification (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER          NOT NULL REFERENCES "user"(id),
            type       notificationtype NOT NULL,
            title      VARCHAR(200)     NOT NULL,
            message    TEXT             NOT NULL,
            is_read    BOOLEAN          NOT NULL DEFAULT FALSE,
            link       VARCHAR(255),
            created_at TIMESTAMPTZ      DEFAULT now(),
            updated_at TIMESTAMPTZ      DEFAULT now()
        );
        CREATE INDEX ix_notification_user_id ON notification (user_id);
        CREATE INDEX ix_notification_is_read  ON notification (is_read);

        CREATE TABLE clinicsettings (
            id                  SERIAL PRIMARY KEY,
            brand_name          VARCHAR(120) NOT NULL DEFAULT 'DentaCare',
            tagline             VARCHAR(255),
            address             VARCHAR(255),
            phone               VARCHAR(32),
            email               VARCHAR(255),
            instagram_url       VARCHAR(255),
            telegram_url        VARCHAR(255),
            facebook_url        VARCHAR(255),
            working_hours_note  VARCHAR(255),
            about_text          TEXT,
            created_at          TIMESTAMPTZ  DEFAULT now(),
            updated_at          TIMESTAMPTZ  DEFAULT now()
        );

        CREATE TABLE patientnote (
            id         SERIAL PRIMARY KEY,
            doctor_id  INTEGER NOT NULL REFERENCES doctorprofile(id),
            patient_id INTEGER NOT NULL REFERENCES "user"(id),
            text       TEXT    NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE patientcard (
            id                 SERIAL PRIMARY KEY,
            patient_id         INTEGER NOT NULL REFERENCES "user"(id),
            birth_date         DATE,
            blood_type         VARCHAR(5),
            allergies          TEXT,
            chronic_conditions TEXT,
            general_notes      TEXT,
            created_at         TIMESTAMPTZ DEFAULT now(),
            updated_at         TIMESTAMPTZ DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_patientcard_patient_id ON patientcard (patient_id);

        CREATE TABLE dentalvisit (
            id                       SERIAL PRIMARY KEY,
            patient_card_id          INTEGER NOT NULL REFERENCES patientcard(id),
            appointment_id           INTEGER REFERENCES appointment(id),
            diagnosis                TEXT,
            treatment_performed      TEXT,
            prescriptions            TEXT,
            next_visit_recommendation TEXT,
            doctor_notes             TEXT,
            created_at               TIMESTAMPTZ DEFAULT now(),
            updated_at               TIMESTAMPTZ DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_dentalvisit_appointment_id ON dentalvisit (appointment_id);

        CREATE TABLE position (
            id         SERIAL PRIMARY KEY,
            name       VARCHAR(80) NOT NULL,
            is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE UNIQUE INDEX ix_position_name ON position (name);

        INSERT INTO clinicsettings (brand_name, tagline, working_hours_note)
        VALUES ('DentaCare', 'Ваша посмішка — наша турбота', 'Пн–Пт: 09:00–19:00, Сб: 09:00–15:00');
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS dentalvisit;
        DROP TABLE IF EXISTS patientcard;
        DROP TABLE IF EXISTS patientnote;
        DROP TABLE IF EXISTS clinicsettings;
        DROP TABLE IF EXISTS notification;
        DROP TABLE IF EXISTS expense_category;
        DROP TABLE IF EXISTS expense;
        DROP TABLE IF EXISTS review;
        DROP TABLE IF EXISTS payment;
        DROP TABLE IF EXISTS appointment;
        DROP TABLE IF EXISTS promocode;
        DROP TABLE IF EXISTS scheduleexception;
        DROP TABLE IF EXISTS workschedule;
        DROP TABLE IF EXISTS doctorservice;
        DROP TABLE IF EXISTS service;
        DROP TABLE IF EXISTS doctorprofile;
        DROP TABLE IF EXISTS position;
        DROP TABLE IF EXISTS "user";
        DROP TYPE IF EXISTS userrole;
        DROP TYPE IF EXISTS appointmentstatus;
        DROP TYPE IF EXISTS paymentmethod;
        DROP TYPE IF EXISTS paymentstatus;
        DROP TYPE IF EXISTS notificationtype;
        DROP TYPE IF EXISTS promocodetype;
    """)
