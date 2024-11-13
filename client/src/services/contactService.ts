import api from './api';
import { Contact } from '../types/contact';
import { handleApiError } from '../utils/errorHandler';

export const contactService = {
  async addContact(username: string): Promise<Contact> {
    try {
      const response = await api.post('/api/contacts/add', {
        contact_username: username
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getContacts(search?: string): Promise<Contact[]> {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/api/contacts/${params}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async removeContact(contactId: string): Promise<void> {
    try {
      await api.delete(`/api/contacts/${contactId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};