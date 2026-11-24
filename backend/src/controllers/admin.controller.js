export const adminController = (service) => ({
  list: async (req, res) => res.json(await service.list(req.user)),
  changeRole: async (req, res) => res.json(await service.changeRole(req.user, req.params.id, req.body)),
  setActive: async (req, res) => res.json(await service.setActive(req.user, req.params.id, req.body)),
});
