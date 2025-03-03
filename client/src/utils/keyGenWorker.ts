// Este arquivo será executado em um Web Worker
import { ElGamal } from './elgamal';
import { encryptPrivateKey } from './cryptoUtils';

// Define explicitamente o escopo self para o contexto do Worker
const workerScope = self as unknown as Worker;

// Responde às mensagens do thread principal
workerScope.onmessage = async (e) => {
  try {
    const { action, password } = e.data;

    if (action === 'generateKeys') {
      // Inicia a geração de chaves
      console.log('Worker: iniciando geração de chaves');
      const elgamal = new ElGamal();
      const { publicKey, privateKey } = elgamal;

      console.log('Worker: chaves geradas, iniciando criptografia');
      // Criptografa a chave privada com a senha fornecida
      const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);

      console.log('Worker: processo concluído, enviando resposta');
      // Envia as chaves de volta para o thread principal
      workerScope.postMessage({
        success: true,
        data: {
          publicKey,
          privateKey,
          encryptedPrivateKey
        }
      });
    }
  } catch (error: unknown) {
    console.error('Worker error:', error);
    // Em caso de erro, envia uma mensagem de erro
    workerScope.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na geração de chaves'
    });
  }
};