import noEntityGetSet from './no-entity-get-set';
import noStaticSingleton from './no-static-singleton';
import noEntitySpread from './no-entity-spread';
import useUuidsEqual from './use-uuids-equal';
import memberNamingConvention from './member-naming-convention';
import noNgOnChanges from './no-ng-on-changes';
import noCrossPackageReexport from './no-cross-package-reexport';
import noRouterInGeneric from './no-router-in-generic';
import noFieldsWithEntityObject from './no-fields-with-entity-object';
import noEnumPreferUnion from './no-enum-prefer-union';
import noKendoIcons from './no-kendo-icons';
import noLegacyTemplateSyntax from './no-legacy-template-syntax';
import noDirectEntityNew from './no-direct-entity-new';
import noRunviewInLoop from './no-runview-in-loop';
import runviewCheckSuccess from './runview-check-success';
import entitySaveCheckResult from './entity-save-check-result';
import preferInjectFunction from './prefer-inject-function';
import forRequiresTrack from './for-requires-track';
import noAnyType from './no-any-type';
import noActionCallAction from './no-action-call-action';
import requireStandaloneFalse from './require-standalone-false';
import noPromiseAllRunview from './no-promise-all-runview';
import preferSimpleResultType from './prefer-simple-result-type';
import noGlobalProviderOnServer from './no-global-provider-on-server';

export const rules = {
  'no-entity-get-set': noEntityGetSet,
  'no-static-singleton': noStaticSingleton,
  'no-entity-spread': noEntitySpread,
  'use-uuids-equal': useUuidsEqual,
  'member-naming-convention': memberNamingConvention,
  'no-ng-on-changes': noNgOnChanges,
  'no-cross-package-reexport': noCrossPackageReexport,
  'no-router-in-generic': noRouterInGeneric,
  'no-fields-with-entity-object': noFieldsWithEntityObject,
  'no-enum-prefer-union': noEnumPreferUnion,
  'no-kendo-icons': noKendoIcons,
  'no-legacy-template-syntax': noLegacyTemplateSyntax,
  'no-direct-entity-new': noDirectEntityNew,
  'no-runview-in-loop': noRunviewInLoop,
  'runview-check-success': runviewCheckSuccess,
  'entity-save-check-result': entitySaveCheckResult,
  'prefer-inject-function': preferInjectFunction,
  'for-requires-track': forRequiresTrack,
  'no-any-type': noAnyType,
  'no-action-call-action': noActionCallAction,
  'require-standalone-false': requireStandaloneFalse,
  'no-promise-all-runview': noPromiseAllRunview,
  'prefer-simple-result-type': preferSimpleResultType,
  'no-global-provider-on-server': noGlobalProviderOnServer,
};
