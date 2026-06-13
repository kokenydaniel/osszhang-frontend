import { FeatureFlagsPage } from '@/components/admin/feature-flags-page';

export default function Page() {
  return (
    <FeatureFlagsPage
      category="platform"
      title="Platform admin / Platform szolgáltatások"
      description="Keretrendszer-szintű funkciók — csatolmányok, webhook API és audit napló rögzítés. Ezek nem app modulok és nem AI eszközök."
      currentRoute="/admin/platform-services"
    />
  );
}
