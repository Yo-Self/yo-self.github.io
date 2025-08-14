import { notFound } from 'next/navigation';
import { OrganizationService } from '@/services/organizations';
import Link from 'next/link';
import Image from 'next/image';

interface OrganizationPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const organizations = await OrganizationService.listForStatic();
  
  return organizations.map((organization) => ({
    slug: organization.slug,
  }));
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  // Buscar a organização com seus restaurantes
  const result = await OrganizationService.getWithRestaurants(params.slug);

  if (!result) {
    notFound();
  }

  const { organization, restaurants } = result;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Organização */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            {organization.avatar_url && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={organization.avatar_url}
                  alt={organization.full_name || 'Organização'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {organization.full_name || 'Organização'}
              </h1>
              <p className="text-gray-600 mt-1">
                {restaurants?.length || 0} restaurante{restaurants?.length !== 1 ? 's' : ''} disponível{restaurants?.length !== 1 ? 'is' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Restaurantes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {restaurants && restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurant/${restaurant.slug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                <div className="relative h-48">
                  <Image
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {restaurant.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {restaurant.cuisine_type}
                  </p>
                  {restaurant.description && (
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum restaurante encontrado
            </h3>
            <p className="text-gray-500">
              Esta organização ainda não possui restaurantes cadastrados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
