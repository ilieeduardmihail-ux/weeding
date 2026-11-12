/**
 * The request's clock, for server components.
 *
 * React may render a component more than once for one request, so reading the
 * clock inline (`Date.now()` in the component body) makes the output depend on
 * when the paint happened rather than on the request. Reading it here, behind a
 * server-only function, keeps "which moment am I rendering" a property of the
 * request and not of a re-render.
 */
import "server-only";

export function requestNow(): number {
  return Date.now();
}
