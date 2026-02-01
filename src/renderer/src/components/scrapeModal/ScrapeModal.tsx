import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrapeForm } from './ScrapeForm';
import { useScrapeForm } from './useScrapeForm';
import { useBackend } from '@/hooks/useBaseUrl';
import ScrapeProgress from './ScrapeProgress';
import { useState } from 'react';
import { useDashboard } from '@/screens/dashboard/DashboardContext';

export default function ScrapeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    isScraping,
    setIsScraping,
    toggleSite,
    validateForm,
  } = useScrapeForm();

  const { baseUrl } = useBackend();
  const { refreshDashboard } = useDashboard(); // Get from context
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsScraping(true);
    console.log('📤 Scrape Payload:', formData);

    const FETCH_url = `${baseUrl}/api/scrape/start`;

    try {
      const response = await fetch(FETCH_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.error('❌ Error:', response.statusText);
        setIsScraping(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Scrape Response:', data);

      // Set the session ID to trigger progress view
      setSessionId(data.session_id);
    } catch (error) {
      console.error('❌ Scrape error:', error);
      setIsScraping(false);
    }
  };

  const handleCancel = async () => {
    if (!sessionId) return;

    console.log('⏸️  Cancelling scrape session:', sessionId);

    try {
      await fetch(`${baseUrl}/api/scrape/cancel/${sessionId}`, {
        method: 'POST',
      });
      console.log('✅ Scrape cancelled successfully');
    } catch (error) {
      console.error('❌ Cancel error:', error);
    }
  };

  const handleComplete = async () => {
    console.log('🎉 Scraping completed! Refreshing dashboard...');

    // Reset state
    setSessionId(null);
    setIsScraping(false);

    // Refresh the dashboard data
    await refreshDashboard();
    console.log('✅ Dashboard refreshed');

    // Close the modal
    onClose();
  };

  const handleDialogClose = () => {
    // Only close if not scraping
    if (!isScraping) {
      console.log('🚪 Dialog closed by user');
      setSessionId(null);
      onClose();
    } else {
      console.log('⚠️  Cannot close dialog while scraping is in progress');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl">
        {!sessionId ? (
          <ScrapeForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            isScraping={isScraping}
            toggleSite={toggleSite}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        ) : (
          <ScrapeProgress
            sessionId={sessionId}
            baseUrl={baseUrl}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
