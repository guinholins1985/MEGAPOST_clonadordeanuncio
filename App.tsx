import React, { useState, useCallback } from 'react';
import { AdContent, AppStatus, Specification } from './types';
import { extractAdContentFromUrl, optimizeAdContent } from './services/geminiService';
import Spinner from './components/Spinner';
import { SparklesIcon, ClipboardIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [adContent, setAdContent] = useState<AdContent | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.Idle);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = useCallback(async () => {
    if (!url) {
      setError('Por favor, insira um URL válido.');
      setStatus(AppStatus.Error);
      return;
    }
    setError(null);
    setAdContent(null);
    setStatus(AppStatus.Extracting);
    try {
      const content = await extractAdContentFromUrl(url);
      setAdContent(content);
      setStatus(AppStatus.Success);
    } catch (e) {
      console.error(e);
      setError('Não foi possível extrair o conteúdo. Verifique o URL e tente novamente. Isso funciona melhor com produtos populares e publicamente indexados.');
      setStatus(AppStatus.Error);
    }
  }, [url]);

  const handleOptimize = useCallback(async () => {
    if (!adContent) return;
    setError(null);
    setStatus(AppStatus.Optimizing);
    try {
      const optimizedContent = await optimizeAdContent(adContent);
      setAdContent(optimizedContent);
      setStatus(AppStatus.Success);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro durante a otimização.');
      setStatus(AppStatus.Error);
    }
  }, [adContent]);
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  const handleContentChange = <K extends keyof AdContent>(field: K, value: AdContent[K]) => {
    setAdContent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
    setAdContent(prev => {
        if (!prev || !prev.specifications) return prev;
        const newSpecs = [...prev.specifications];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        return { ...prev, specifications: newSpecs };
    });
  };

  const isProcessing = status === AppStatus.Extracting || status === AppStatus.Optimizing;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Clonador de Anúncios IA
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Cole o URL de um anúncio de marketplace para extrair e otimizar o conteúdo instantaneamente com a IA da Gemini.
          </p>
        </header>

        <div className="max-w-3xl mx-auto bg-gray-800/50 rounded-xl shadow-2xl shadow-purple-500/10 backdrop-blur-sm border border-gray-700">
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole o URL do produto aqui..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition duration-200 text-gray-200 placeholder-gray-500"
                  disabled={isProcessing}
                />
              </div>
              <button
                onClick={handleExtract}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                disabled={isProcessing || !url}
              >
                {status === AppStatus.Extracting ? <Spinner /> : 'Analisar Anúncio'}
              </button>
            </div>
          </div>
        </div>
        
        {isProcessing && (
            <div className="text-center mt-8 text-purple-400">
              <p>{status === AppStatus.Extracting ? 'Analisando o URL e extraindo conteúdo...' : 'Otimizando o anúncio com IA...'}</p>
            </div>
        )}

        {error && (
          <div className="mt-8 max-w-3xl mx-auto bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
            <p>{error}</p>
          </div>
        )}

        {adContent && status !== AppStatus.Extracting && (
          <div className="mt-10 max-w-5xl mx-auto flex flex-col gap-6">
              
            {adContent.imageUrls.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
                    <h2 className="text-xl font-semibold mb-4 text-gray-300">Imagens Extraídas</h2>
                     <div className="flex overflow-x-auto gap-4 pb-4">
                        {adContent.imageUrls.map((imgUrl, index) => (
                          <img key={index} src={imgUrl} alt={`Product image ${index + 1}`} 
                               className="h-48 w-48 object-cover rounded-lg flex-shrink-0 border-2 border-gray-700 shadow-lg"
                               onError={(e) => (e.currentTarget.src = 'https://picsum.photos/200')} />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Título</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.title)} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.title} 
                onChange={(e) => handleContentChange('title', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Marca</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.brand || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.brand || ''} 
                onChange={(e) => handleContentChange('brand', e.target.value)}
                placeholder="Marca do produto"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Preço</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.price || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.price || ''} 
                onChange={(e) => handleContentChange('price', e.target.value)}
                placeholder="Preço do produto"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Categoria</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.category || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.category || ''} 
                onChange={(e) => handleContentChange('category', e.target.value)}
                placeholder="Categoria do produto"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Condição</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.condition || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.condition || ''} 
                onChange={(e) => handleContentChange('condition', e.target.value)}
                placeholder="Condição do produto (ex: Novo, Usado)"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">SKU / Modelo</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.sku || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.sku || ''} 
                onChange={(e) => handleContentChange('sku', e.target.value)}
                placeholder="SKU ou número do modelo"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
              <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Disponibilidade</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.availability || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
              </div>
              <input 
                type="text" 
                value={adContent.availability || ''} 
                onChange={(e) => handleContentChange('availability', e.target.value)}
                placeholder="Status do estoque"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
               <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Descrição</h2>
                  <button onClick={() => handleCopyToClipboard(adContent.description)} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
                </div>
              <textarea 
                value={adContent.description} 
                onChange={(e) => handleContentChange('description', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 h-48 resize-none text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>

            {adContent.specifications && adContent.specifications.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-300">Especificações</h2>
                      <button onClick={() => handleCopyToClipboard(adContent.specifications?.map(s => `${s.key}: ${s.value}`).join('\n') || '')} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
                  </div>
                  <div className="space-y-3">
                      {adContent.specifications.map((spec, index) => (
                          <div key={index} className="flex flex-col sm:flex-row gap-2 items-center">
                              <input
                                  type="text"
                                  value={spec.key}
                                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                                  placeholder="Característica"
                                  className="w-full sm:w-1/3 bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              />
                              <input
                                  type="text"
                                  value={spec.value}
                                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                                  placeholder="Valor"
                                  className="w-full sm:w-2/3 bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                              />
                          </div>
                      ))}
                  </div>
              </div>
            )}

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
               <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-300">Tags</h2>
                   <button onClick={() => handleCopyToClipboard(adContent.tags.join(', '))} className="text-gray-400 hover:text-white transition"><ClipboardIcon /></button>
                </div>
                <input
                    type="text"
                    value={adContent.tags.join(', ')}
                    onChange={(e) => handleContentChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                    placeholder="Adicione tags separadas por vírgula"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
            </div>
            
             <div className="mt-4 text-center">
                 <button
                    onClick={handleOptimize}
                    disabled={isProcessing}
                    className="w-full md:w-auto bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-lg transition-opacity duration-300 flex items-center justify-center gap-2 text-lg shadow-lg"
                 >
                   {status === AppStatus.Optimizing ? <Spinner /> : <><SparklesIcon /> Otimizar Todo o Conteúdo</>}
                 </button>
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;