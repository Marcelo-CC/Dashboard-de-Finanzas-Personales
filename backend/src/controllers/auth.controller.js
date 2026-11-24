export const authController = (authService) => ({
  register: async (req, res) => res.status(201).json(await authService.register(req.body)),
  login: async (req, res) => res.json(await authService.login(req.body)),
  me: async (req, res) => res.json(await authService.me(req.user)),
  forgotPassword: async (req, res) => res.json(await authService.forgotPassword(req.body)),
  verifyResetToken: async (req, res) => res.json(await authService.verifyResetToken(req.params.token)),
  resetPassword: async (req, res) => res.json(await authService.resetPassword(req.body)),
});
