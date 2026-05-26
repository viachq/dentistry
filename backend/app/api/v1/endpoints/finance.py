from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.expense import ExpenseCreate, ExpenseRead
from app.schemas.expense_category import ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryRead
from app.schemas.finance import AdminFinanceSummary, DoctorFinanceSummary
from app.services import finance as finance_service
from app.models.expense_category import ExpenseCategory

router = APIRouter()


@router.get("/summary", response_model=AdminFinanceSummary)
def get_finance_summary(
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> AdminFinanceSummary:
    return finance_service.get_admin_finance_summary(db, date_from, date_to)


@router.get("/doctors", response_model=list[DoctorFinanceSummary])
def get_all_doctor_finance(
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[DoctorFinanceSummary]:
    return finance_service.get_all_doctor_finance(db, date_from, date_to)


@router.get("/doctors/me", response_model=DoctorFinanceSummary)
def get_my_finance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DOCTOR)),
) -> DoctorFinanceSummary:
    return finance_service.get_doctor_own_finance(db, current_user)


@router.get("/expenses", response_model=list[ExpenseRead])
def get_expenses(
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[ExpenseRead]:
    return finance_service.get_expenses(db, date_from, date_to)


@router.post("/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ExpenseRead:
    return finance_service.create_expense(db, payload)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> None:
    finance_service.delete_expense(db, expense_id)


@router.get("/expense-categories", response_model=list[ExpenseCategoryRead])
def list_expense_categories(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[ExpenseCategoryRead]:
    cats = db.query(ExpenseCategory).all()
    return [ExpenseCategoryRead.model_validate(c) for c in cats]


@router.post("/expense-categories", response_model=ExpenseCategoryRead, status_code=status.HTTP_201_CREATED)
def create_expense_category(
    payload: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ExpenseCategoryRead:
    cat = ExpenseCategory(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return ExpenseCategoryRead.model_validate(cat)


@router.patch("/expense-categories/{cat_id}", response_model=ExpenseCategoryRead)
def update_expense_category(
    cat_id: int,
    payload: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ExpenseCategoryRead:
    from fastapi import HTTPException
    cat = db.query(ExpenseCategory).filter(ExpenseCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return ExpenseCategoryRead.model_validate(cat)
