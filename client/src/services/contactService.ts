import api from './api';
import { Contact } from '../types/contact';

export const contactService = {
  async addContact(username: string): Promise<Contact> {
    try {
      const response = await api.post('/api/contacts/add', {
        contact_username: username
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Requisição inválida.');
      } else if (error.response?.status === 401) {
        throw new Error('Usuário não autorizado.');
      } else if (error.response?.status === 404) {
        throw new Error('Usuário não encontrado.');
      } else if (error.response?.status === 409) {
        throw new Error('Este contato já existe.');
      } else if (error.response?.status === 403) {
        throw new Error('Você não pode adicionar a si mesmo como contato.');
      }
      throw new Error('Erro ao adicionar contato.');
    }
  },

  async getContacts(): Promise<Contact[]> {
    try {
      const response = await api.get('/api/contacts');
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao buscar contatos.');
    }
  },

  async removeContact(contactId: string): Promise<void> {
    try {
      await api.delete(`/api/contacts/${contactId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Contato não encontrado.');
      }
      throw new Error('Erro ao remover contato.');
    }
  }
};