import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { wedding } from "@/lib/config";

export function Faq() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <h2 className="font-display text-4xl">Good to know</h2>
      <Accordion type="single" collapsible className="mt-8">
        {wedding.faq.map((f, i) => (
          <AccordionItem key={f.q} value={`q${i}`}>
            <AccordionTrigger className="text-left text-lg">{f.q}</AccordionTrigger>
            <AccordionContent className="text-base text-ink/75">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
