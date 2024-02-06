export const lineHeight = 20
export const barWidthThreshold = 2
export const maxBarWidth = 30
export const minBarWidth = 5

export const commitGradient = Object.values({
  '--color-commit-gradient-0': '#37afa9',
  '--color-commit-gradient-1': '#63b19e',
  '--color-commit-gradient-2': '#80b393',
  '--color-commit-gradient-3': '#97b488',
  '--color-commit-gradient-4': '#abb67d',
  '--color-commit-gradient-5': '#beb771',
  '--color-commit-gradient-6': '#cfb965',
  '--color-commit-gradient-7': '#dfba57',
  '--color-commit-gradient-8': '#efbb49',
  '--color-commit-gradient-9': '#febc38',
})

export const TREE_OPERATION_ADD = 1
export const TREE_OPERATION_REMOVE = 2
export const TREE_OPERATION_REORDER_CHILDREN = 3
export const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4
export const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5
export const TREE_OPERATION_REMOVE_ROOT = 6
export const TREE_OPERATION_SET_SUBTREE_MODE = 7

// WARNING
// The values below are referenced by ComponentFilters (which are saved via localStorage).
// Do not change them or it will break previously saved user customizations.
// If new element types are added, use new numbers rather than re-ordering existing ones.
//
// Changing these types is also a backwards breaking change for the standalone shell,
// since the frontend and backend must share the same values-
// and the backend is embedded in certain environments (like React Native).
export const ElementTypeClass = 1
export const ElementTypeContext = 2
export const ElementTypeFunction = 5
export const ElementTypeForwardRef = 6
export const ElementTypeHostComponent = 7
export const ElementTypeMemo = 8
export const ElementTypeOtherOrUnknown = 9
export const ElementTypeProfiler = 10
export const ElementTypeRoot = 11
export const ElementTypeSuspense = 12
export const ElementTypeSuspenseList = 13
export const ElementTypeTracingMarker = 14
