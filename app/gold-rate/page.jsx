import LiveGoldRate from "@/app/components/LiveGoldRate";

export const metadata = {
  title: "Live Gold Rate | SPT Bullion",
  description: "Live 24K/22K/21K/18K gold rates per gram and tola.",
};

export default function GoldRatePage() {
  return <LiveGoldRate />;
}
