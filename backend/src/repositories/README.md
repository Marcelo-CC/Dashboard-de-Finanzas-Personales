# Capa de repositorios

Contrato común (implementado por `mongo/` y `memory/`):

- **Repositorios por usuario (multiinquilino):** `findAll(userId, filter, { sort, skip, limit })`, `count(userId, filter)`,
  `findById(userId, id)`, `findOne(userId, filter)`, `create(userId, data)`, `update(userId, id, patch)`,
  `delete(userId, id)`, `updateMany(userId, filter, patch)`, `sum(userId, filter, groupBy)`.
  **Todos exigen `userId`** y lo agregan al filtro: es imposible consultar o modificar datos de otro usuario
  desde la capa de servicios (aislamiento de datos a nivel de repositorio).
- **UserRepository:** `findById`, `findByEmail`, `create`, `update`, `list`, `count`.

Los filtros admiten igualdad y los operadores `$gte`, `$lte`, `$gt`, `$lt`, `$in`, `$ne`.
`memory/` existe para pruebas automáticas y modo demo (`DATA_DRIVER=memory`); producción usa `mongo/`.
