import api from '@/lib/api';
import { criarNotificacoesService } from '@/lib/notificacoes-api.mjs';

export const notificacoesService = criarNotificacoesService(api);
