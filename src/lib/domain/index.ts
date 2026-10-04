/**
 * Domain seam barrel.
 *
 * Pages and components import view models and (rarely) adapters from here —
 * never from `src/data/*` directly (feed data excepted, which is outside the
 * domain seam).
 */

export * from "./maps";
export * from "./adapt";
export * from "./resolve";
export * from "./viewModels";
