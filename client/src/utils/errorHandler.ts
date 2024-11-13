import { toast } from '@/hooks/use-toast';

interface ErrorResponse {
  message?: string;
  error?: string;
  status?: number;
}

export const handleApiError = (error: any): string => {
  if (error.response) {
    const response: ErrorResponse = error.response.data;

    switch (error.response.status) {
      case 400:
        return response.message || 'Requisição inválida';
      case 401:
        return 'Usuário não autorizado';
      case 403:
        return 'Acesso negado';
      case 404:
        return response.message || 'Recurso não encontrado';
      case 409:
        return response.message || 'Conflito detectado';
      case 500:
        return 'Erro interno do servidor';
      default:
        return response.message || 'Ocorreu um erro inesperado';
    }
  }

  return error.message || 'Erro de conexão com o servidor';
};

export const showErrorToast = (error: any) => {
  const message = handleApiError(error);
  toast({
    title: "Erro",
    description: message,
    variant: "destructive",
  });
};