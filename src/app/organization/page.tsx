import { OrganizationService } from '@/services/organizations';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrganizationsPage() {
  const organizations = await OrganizationService.list();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organizações Parceiras
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Descubra restaurantes incríveis de nossas organizações parceiras
          </p>
        </div>
      </div>

      {/* Lista de Organizações */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {organizations && organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/organization/${organization.slug}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    {organization.avatar_url && (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image
                          src={organization.avatar_url}
                          alt={organization.full_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {organization.full_name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Organização parceira
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      Ver restaurantes
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma organização encontrada
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Em breve teremos organizações parceiras disponíveis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
