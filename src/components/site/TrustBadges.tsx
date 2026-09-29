import { Shield, Award, Heart, CheckCircle } from 'lucide-react';

const badges = [
  { icon: Shield, text: 'NJ DDD Approved' },
  { icon: Award, text: 'Certified Provider' },
  { icon: Heart, text: 'Compassionate Care' },
  { icon: CheckCircle, text: 'Background Checked' },
];

export default function TrustBadges() {
  return (
    <div className="border-y border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {badges.map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center text-center">
              <div className="mb-3 grid h-16 w-16 place-items-center rounded-full bg-steel/10">
                <Icon className="h-8 w-8 text-steel" />
              </div>
              <p className="text-sm font-semibold text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
