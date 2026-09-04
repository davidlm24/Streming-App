const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newCode = `      {/* Plans Modal */}
      {(isPlansModalOpen || paymentStatus === 'success') && user && (
        <PlansModal
          onClose={() => {
            setIsPlansModalOpen(false);
            setPaymentStatus(null);
          }}
          userEmail={user.email}
          userId={user.uid || ''}
          currentPlan={user.plan}
        />
      )}

      {/* Trial Expired Overlay */}
      {user && (user.subscriptionStatus === 'trial' || !user.subscriptionStatus) && new Date(user.trialEndsAt || new Date(Date.now() - 1000).toISOString()) < new Date() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0c0f18] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Período de Teste Expirado</h2>
            <p className="text-slate-400 mb-6 text-sm">Seu período de teste gratuito chegou ao fim. Para continuar usando o PwStreamer Cloud Studio e seus recursos avançados, por favor, escolha um de nossos planos.</p>
            <button 
              onClick={() => setIsPlansModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
            >
              Ver Planos e Assinar
            </button>
            <button 
              onClick={handleLogout}
              className="mt-3 text-slate-500 hover:text-white text-xs transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(/    <\/div>\s*  \);\s*\}\s*$/, newCode);
fs.writeFileSync('src/App.tsx', code);
