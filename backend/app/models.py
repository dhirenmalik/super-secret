from .core.database import Base

# Import Analytics models FIRST to resolve dependencies in Governance models
from .modules.analytics.models import (
    Stack,
    EDAResult,
    SubcatAnalysis,
    ModelGroup,
    ModelGroupL2
)

from .modules.governance.models import (
    role_permissions,
    Role,
    Permission,
    User,
    WorkflowStage,
    Model,
    ModelFile,
    ModelStageApproval,
    ModelAssignment,
    Notification
)
