import { PublicKey, PrivateKey } from '@/utils/elgamal';

interface KeyGenResult {
  publicKey: PublicKey;
  privateKey: PrivateKey;
  encryptedPrivateKey: string;
}

class KeyGenerationService {
  private worker: Worker | null = null;

  /**
   * Gera chaves ElGamal de forma assíncrona usando um Web Worker
   * @param password Senha do usuário para criptografar a chave privada
   * @returns Uma promessa que resolve com as chaves geradas
   */
  generateKeysAsync(password: string): Promise<KeyGenResult> {
    return new Promise((resolve, reject) => {
      try {
        // Cria o Web Worker apenas se ele ainda não existir
        if (!this.worker) {
          // Carregar o Web Worker
          this.worker = new Worker(
            new URL('../utils/keyGenWorker.ts', import.meta.url),
            { type: 'module' }
          );
        }

        // Configurar o callback para receber a resposta do worker
        const onMessage = (e: MessageEvent) => {
          this.worker?.removeEventListener('message', onMessage);

          if (e.data.success) {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error || 'Falha na geração de chaves'));
          }
        };

        // Registrar o callback
        this.worker.addEventListener('message', onMessage);

        // Iniciar o processo de geração de chaves
        this.worker.postMessage({
          action: 'generateKeys',
          password
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Termina o Web Worker quando não for mais necessário
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Exporta uma instância única do serviço
export const keyGenService = new KeyGenerationService();