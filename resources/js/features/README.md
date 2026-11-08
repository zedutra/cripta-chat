# Features Directory (React / Inertia)

Organize os módulos de negócio do frontend dentro de `resources/js/features/<nome-do-modulo>/`:

```text
resources/js/features/
  └── <modulo>/
      ├── components/   # Componentes exclusivos deste módulo
      ├── hooks/        # Hooks customizados de estado/efeito do módulo
      ├── types/        # Tipagens TypeScript específicas do domínio
      └── index.ts      # Barrel file exportando a API pública da feature
```

As páginas em `resources/js/pages/` atuam apenas como pontos de entrada de rota do Inertia, compondo os componentes exportados de `resources/js/features/`.
