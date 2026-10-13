export const DOG_BREEDS = [
  'Indie / Indian Pariah',
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'Beagle',
  'Pug',
  'Shih Tzu',
  'Pomeranian',
  'Indian Spitz',
  'Rottweiler',
  'Doberman',
  'Boxer',
  'Siberian Husky',
  'Cocker Spaniel',
  'Dachshund',
  'French Bulldog',
  'Bulldog',
  'Great Dane',
  'Dalmatian',
  'Border Collie',
  'Poodle',
  'Chihuahua',
  'Yorkshire Terrier',
  'Saint Bernard',
  'Rajapalayam',
  'Mudhol Hound',
  'Kombai',
  'Mixed breed',
  'Other',
] as const;

export const CAT_BREEDS = [
  'Indian Domestic / Indie',
  'Persian',
  'Maine Coon',
  'Siamese',
  'British Shorthair',
  'Bengal',
  'Ragdoll',
  'Scottish Fold',
  'American Shorthair',
  'Bombay',
  'Himalayan',
  'Sphynx',
  'Abyssinian',
  'Russian Blue',
  'Mixed breed',
  'Other',
] as const;

export function breedsForSpecies(species: 'dog' | 'cat' | null): readonly string[] {
  if (species === 'dog') return DOG_BREEDS;
  if (species === 'cat') return CAT_BREEDS;
  return [];
}
