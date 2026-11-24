export const categoryController = (service) => ({
  list: async (req, res) => res.json(await service.list(req.user, req.query)),
  create: async (req, res) => res.status(201).json(await service.create(req.user, req.body)),
  rename: async (req, res) => res.json(await service.rename(req.user, req.params.id, req.body)),
  remove: async (req, res) => res.json(await service.remove(req.user, req.params.id, req.query)),
});
