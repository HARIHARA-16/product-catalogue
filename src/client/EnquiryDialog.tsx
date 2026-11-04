import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, LoaderCircle, Mail, X } from 'lucide-react';
import { enquirySchema, type Product, type Enquiry } from '../shared/contracts';
import { api } from './api';

type Fields = Partial<Record<keyof Enquiry, string[]>>;

export function EnquiryDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [fields, setFields] = useState<Fields>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  function close() {
    dialog.current?.close();
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const form = new FormData(event.currentTarget);
    const parsed = enquirySchema.safeParse({
      productId: product.id,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? ''),
      message: String(form.get('message') ?? ''),
    });
    setError('');
    if (!parsed.success) {
      setFields(parsed.error.flatten().fieldErrors);
      return;
    }
    setFields({});
    setStatus('sending');
    try {
      await api.enquire(parsed.data);
      setStatus('success');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your enquiry could not be sent.');
      setStatus('idle');
    }
  }

  return <dialog ref={dialog} className="enquiry-dialog" aria-labelledby="enquiry-title" onCancel={(event) => {
    event.preventDefault();
    if (status !== 'sending') close();
  }}>
    <button className="icon-button dialog-close" aria-label="Close enquiry" title="Close enquiry" disabled={status === 'sending'} onClick={close}><X size={21} /></button>
    {status === 'success' ? <div className="success-state" role="status">
      <span className="success-icon"><Check size={30} /></span>
      <span className="eyebrow">Enquiry received</span>
      <h2 id="enquiry-title">Thank you for getting in touch.</h2>
      <p>Our team has received your enquiry and will respond to the email address you provided.</p>
      <button className="button primary" onClick={close}>Back to the product</button>
    </div> : <>
      <span className="eyebrow">Product enquiry</span>
      <h2 id="enquiry-title">How can we help?</h2>
      <p className="enquiry-product">{product.title}</p>
      <form onSubmit={submit} noValidate aria-busy={status === 'sending'}>
        <fieldset disabled={status === 'sending'}>
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" required maxLength={100} onChange={() => setFields((current) => ({ ...current, name: undefined }))} aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? 'name-error' : undefined} />
          {fields.name && <span className="field-error" id="name-error">{fields.name[0]}</span>}
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} onChange={() => setFields((current) => ({ ...current, email: undefined }))} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'email-error' : undefined} />
          {fields.email && <span className="field-error" id="email-error">{fields.email[0]}</span>}
          <label htmlFor="phone">Phone number <span>(optional)</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
          <label htmlFor="message">How can we help?</label>
          <textarea id="message" name="message" rows={4} required minLength={10} maxLength={2000} onChange={() => setFields((current) => ({ ...current, message: undefined }))} aria-invalid={Boolean(fields.message)} aria-describedby={fields.message ? 'message-error' : undefined} />
          {fields.message && <span className="field-error" id="message-error">{fields.message[0]}</span>}
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="privacy-note">We’ll use your contact details only to respond to this enquiry.</p>
        <button className="button primary full-width" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? <LoaderCircle size={18} className="spin" /> : <Mail size={18} />}
          {status === 'sending' ? 'Sending…' : 'Submit enquiry'}
        </button>
      </form>
    </>}
  </dialog>;
}