export const budgetController = (service) => ({
  status: async (req, res) => res.json(await service.status(req.user, req.params.month)),
  upsert: async (req, res) => res.json(await service.upsert(req.user, req.body)),
  remove: async (req, res) => res.json(await service.remove(req.user, req.params.month)),
});
