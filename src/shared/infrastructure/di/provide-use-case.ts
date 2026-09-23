import type { FactoryProvider, InjectionToken } from '@nestjs/common';

type UseCaseClass<T> = abstract new (...deps: never[]) => T;

/**
 * Use cases are plain classes (no Nest decorators, rule 2), so modules register them through a
 * factory. `inject` lists the port tokens in constructor-parameter order.
 */
export function provideUseCase<T>(
  useCase: UseCaseClass<T>,
  inject: InjectionToken[],
): FactoryProvider<T> {
  const Ctor = useCase as unknown as new (...deps: unknown[]) => T;
  return { provide: useCase, useFactory: (...deps: unknown[]) => new Ctor(...deps), inject };
}
