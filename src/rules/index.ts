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
};
