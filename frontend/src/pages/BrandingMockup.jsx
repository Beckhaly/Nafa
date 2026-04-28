export default function BrandingMockup() {
  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Restructuration du Branding - Maquettes</h1>

        <div className="space-y-8">
          {/* ========== LOGIN PAGE ========== */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">📱 Page de Connexion</h2>

              <div className="grid grid-cols-2 gap-8">
                {/* CURRENT */}
                <div className="border-2 border-red-300 rounded-lg p-6">
                  <h3 className="font-bold text-red-600 mb-4">❌ ACTUEL (Problème)</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      {/* Left panel */}
                      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-8 rounded h-96 flex flex-col">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">N</div>
                            <span className="text-xl font-bold">NAFA</span>
                          </div>
                          <p className="text-blue-200 text-xs">Plateforme de gestion associative</p>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h2 className="text-2xl font-bold">Gérez votre association</h2>
                          <p className="text-blue-100 text-sm mt-2">Hardcoded "NAFA" — pas de paramètres</p>
                          <p className="text-yellow-300 text-xs mt-4">⚠️ Pas d'espace pour le logo/nom de l'association</p>
                        </div>
                        <p className="text-blue-300 text-xs">GEO_ASSOCIATION — v1.0</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-6 rounded flex flex-col justify-center">
                      <h3 className="font-bold mb-2">Formulaire</h3>
                      <p className="text-sm text-gray-600">Email ou téléphone</p>
                      <div className="bg-white border rounded h-8 mt-2 mb-4"></div>
                      <p className="text-sm text-gray-600">Mot de passe</p>
                      <div className="bg-white border rounded h-8 mt-2"></div>
                    </div>
                  </div>
                </div>

                {/* PROPOSED */}
                <div className="border-2 border-green-300 rounded-lg p-6">
                  <h3 className="font-bold text-green-600 mb-4">✅ PROPOSÉ (Solution)</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      {/* Left panel */}
                      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-6 rounded h-96 flex flex-col">
                        {/* App branding */}
                        <div className="border-b border-blue-600 pb-4 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">N</div>
                            <span className="text-lg font-bold">Nafa</span>
                          </div>
                          <p className="text-blue-300 text-xs">Plateforme</p>
                        </div>

                        {/* Association branding */}
                        <div className="mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl">🏢</div>
                            <div>
                              <p className="font-bold text-lg">Association XYZ</p>
                              <p className="text-blue-200 text-xs">Région / Pays</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                          <h2 className="text-2xl font-bold">Gérez votre association</h2>
                          <p className="text-blue-100 text-sm mt-2">Logo et nom paramétrables</p>
                          <p className="text-green-300 text-xs mt-4">✅ Espace dédié au branding de l'association</p>
                        </div>
                        <p className="text-blue-300 text-xs">GEO_ASSOCIATION · Nafa v1.0</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-6 rounded flex flex-col justify-center">
                      <h3 className="font-bold mb-2">Formulaire</h3>
                      <p className="text-sm text-gray-600">Email ou téléphone</p>
                      <div className="bg-white border rounded h-8 mt-2 mb-4"></div>
                      <p className="text-sm text-gray-600">Mot de passe</p>
                      <div className="bg-white border rounded h-8 mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== SIDEBAR ========== */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">📋 Barre Latérale</h2>

              <div className="grid grid-cols-2 gap-8">
                {/* CURRENT */}
                <div className="border-2 border-red-300 rounded-lg p-6">
                  <h3 className="font-bold text-red-600 mb-4">❌ ACTUEL</h3>
                  <div className="bg-blue-700 text-white rounded p-4 w-72">
                    <div className="border-b border-blue-600 pb-4 mb-4">
                      <h1 className="text-xl font-bold truncate">Association XYZ</h1>
                      <p className="text-blue-200 text-xs mt-0.5 truncate">Gestion Associative</p>
                    </div>
                    <nav className="space-y-1">
                      <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-blue-700">📊 Tableau de bord</div>
                      <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-600/60">👥 Membres</div>
                      <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-600/60">💰 Cotisations</div>
                    </nav>
                    <p className="text-xs text-gray-400 mt-4">⚠️ Pas de logo/branding "Nafa"</p>
                  </div>
                </div>

                {/* PROPOSED */}
                <div className="border-2 border-green-300 rounded-lg p-6">
                  <h3 className="font-bold text-green-600 mb-4">✅ PROPOSÉ</h3>
                  <div className="bg-blue-700 text-white rounded p-4 w-72">
                    {/* App branding (fixed, small) */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-600">
                      <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs flex-shrink-0">N</div>
                      <span className="text-xs font-bold opacity-75">Nafa</span>
                    </div>

                    {/* Association branding */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">🏢</div>
                        <div className="min-w-0">
                          <h1 className="text-lg font-bold truncate">Association XYZ</h1>
                          <p className="text-blue-200 text-xs truncate">Région / Pays</p>
                        </div>
                      </div>
                    </div>

                    <nav className="space-y-1">
                      <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-blue-700">📊 Tableau de bord</div>
                      <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-600/60">👥 Membres</div>
                      <div className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-600/60">💰 Cotisations</div>
                    </nav>
                    <p className="text-xs text-green-300 mt-4">✅ Nafa + Association clairement séparés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== PARAMETERS SECTION ========== */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">⚙️ Paramètres à Ajouter</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Paramètre</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Localisation</th>
                  <th className="text-left py-3 px-4 font-semibold">Exemple</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-gray-50">
                  <td className="py-3 px-4">logo_association</td>
                  <td className="py-3 px-4">Image (URL)</td>
                  <td className="py-3 px-4">Sidebar + Login</td>
                  <td className="py-3 px-4">/images/assoc-logo.png</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">nom_association</td>
                  <td className="py-3 px-4">Text</td>
                  <td className="py-3 px-4">Sidebar + Login</td>
                  <td className="py-3 px-4">Association XYZ</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="py-3 px-4">localisation_association</td>
                  <td className="py-3 px-4">Text</td>
                  <td className="py-3 px-4">Sidebar + Login</td>
                  <td className="py-3 px-4">Région / Pays</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">slogan</td>
                  <td className="py-3 px-4">Text</td>
                  <td className="py-3 px-4">Sidebar</td>
                  <td className="py-3 px-4">Gestion Associative</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 Note :</p>
              <p className="text-sm text-blue-800">
                • "Nafa" reste l'application (déjà branded dans le code)<br/>
                • L'association a son propre logo, nom, slogan paramétrables<br/>
                • Clarté visuelle : separation nette entre Nafa (plateforme) et l'association (utilisateur)
              </p>
            </div>
          </div>

          {/* ========== CHANGES SUMMARY ========== */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">🎯 Résumé des Changements</h2>

            <div className="space-y-4">
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-900 mb-2">✅ Login.jsx</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Garder "Nafa" comme application branding (top left)</li>
                  <li>• Ajouter section "Association" avec logo + nom + localisation paramétrables</li>
                  <li>• Utiliser settings API pour récupérer les paramètres</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">✅ Layout.jsx (Sidebar)</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ajouter petit logo "Nafa" en haut (optionnel)</li>
                  <li>• Association logo + nom déjà en place (améliorer le design)</li>
                  <li>• Ajouter "localisation" de l'association</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">✅ Backend Settings</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Vérifier/ajouter colonnes: logo_association, localisation_association</li>
                  <li>• Exposer via /parametres API (déjà en place)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ========== APPROVAL ========== */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 text-lg mb-3">❓ Validation Requise</h3>
          <p className="text-yellow-800 mb-4">Cette maquette propose une restructuration du branding. Avant de procéder :</p>
          <div className="space-y-2 text-sm text-yellow-800">
            <p>1. ✓ Est-ce que la séparation Nafa (plateforme) vs Association (utilisateur) est claire ?</p>
            <p>2. ✓ Les emplacements des logos/noms sont-ils corrects ?</p>
            <p>3. ✓ Manque-t-il un paramètre ?</p>
            <p>4. ✓ Des modifications du design proposé ?</p>
          </div>
        </div>
      </div>
    </div>
  )
}
