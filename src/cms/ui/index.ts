/**
 * Public API for the reusable CMS UI foundation.
 *
 * Modules should import only from `@/cms/ui`, never reach into the
 * individual files — this keeps a single, stable seam between the shared
 * runtime and per-module registrations.
 */
export { StatusBadge } from "./StatusBadge";
export { AutosaveIndicator } from "./AutosaveIndicator";
export { MediaPickerDialog } from "./MediaPickerDialog";
export { VersionHistoryPanel } from "./VersionHistoryPanel";
export { FieldRenderer } from "./FieldRenderer";
export {
  EntityListView,
  DefaultTitleCell,
  StatusCell,
  type EntityListConfig,
  type ListColumn,
} from "./EntityListView";
export {
  EntityEditor,
  type EntityEditorConfig,
} from "./EntityEditor";
export {
  registerCmsModule,
  getCmsUiModule,
  listCmsUiModules,
  type CmsUiModule,
  type RegisterCmsModuleInput,
} from "./module-registry";
export type { FieldDef, FieldSection, FieldValue } from "./fields";
export { slugify } from "./fields";
