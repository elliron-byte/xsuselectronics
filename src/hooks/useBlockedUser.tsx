import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlockedUserContextType {
  isBlocked: boolean;
  loading: boolean;
}

const BlockedUserContext = createContext<BlockedUserContextType>({
  isBlocked: false,
  loading: true,
});

export const BlockedUserProvider = ({ children }: { children: ReactNode }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBlockedStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('registered_users')
        .select('is_blocked')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsBlocked(data?.is_blocked || false);
      setLoading(false);
    };

    checkBlockedStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('blocked-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registered_users',
        },
        async (payload) => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && payload.new.user_id === session.user.id) {
            setIsBlocked(payload.new.is_blocked || false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <BlockedUserContext.Provider value={{ isBlocked, loading }}>
      {isBlocked && !loading && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center pointer-events-auto">
          <div className="bg-background p-6 rounded-lg text-center max-w-sm mx-4">
            <h2 className="text-xl font-bold text-destructive mb-2">Account Suspended</h2>
            <p className="text-muted-foreground">Your account has been temporarily suspended. Please contact support for assistance.</p>
          </div>
        </div>
      )}
      <div className={isBlocked ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </BlockedUserContext.Provider>
  );
};

export const useBlockedUser = () => useContext(BlockedUserContext);
