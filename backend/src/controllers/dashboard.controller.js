import { currentMonth } from '../utils/dates.js';

export const dashboardController = (service) => ({
  summary: async (req, res) => res.json(await service.summary(req.user, req.query.month || currentMonth())),
  charts: async (req, res) => res.json(await service.charts(req.user, req.query.month || currentMonth(), req.query.months)),
});
