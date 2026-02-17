// Script de Limpeza do LocalStorage (Execute no DevTools Console)

// 1. Limpar chaves antigas
localStorage.removeItem('widget-layout');
localStorage.removeItem('finance-flow-widget-layout');

// 2. Recarregar a página
window.location.reload();

console.log('✅ Layout resetado! Aguarde o carregamento...');
