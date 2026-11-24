export const accountController = (service) => ({
  list: async (req, res) => res.json(await service.list(req.user)),
  create: async (req, res) => res.status(201).json(await service.create(req.user, req.body)),
  update: async (req, res) => res.json(await service.update(req.user, req.params.id, req.body)),
  remove: async (req, res) => res.json(await service.remove(req.user, req.params.id)),
});
