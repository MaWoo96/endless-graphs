"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Entity {
  id: string;
  name: string;
  tenant_id: string;
  entity_type: string | null;
  ein: string | null;
  created_at: string | null;
}

interface EntityContextValue {
  entities: Entity[];
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity) => void;
  isLoading: boolean;
  error: string | null;
  tenantName: string | null;
  isDemo: boolean;
}

// Demo tenant ID for showcase data
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

const EntityContext = createContext<EntityContextValue | undefined>(undefined);

const STORAGE_KEY = "endless_selected_entity_id";

export function EntityProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntityState] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const supabase = createClient();

  // Load entities for the current user's tenant (or demo tenant)
  useEffect(() => {
    const loadEntities = async () => {
      setIsLoading(true);
      setError(null);

      // Check for demo mode via URL parameter (using window.location to avoid Suspense requirement)
      const urlParams = new URLSearchParams(window.location.search);
      const isDemoMode = urlParams.get("demo") === "true";
      setIsDemo(isDemoMode);

      try {
        let tenantId: string | null = null;

        if (isDemoMode) {
          // Demo mode - use hardcoded demo tenant
          tenantId = DEMO_TENANT_ID;
          setTenantName("Acme Digital Consulting (Demo)");
        } else {
          // Normal mode - get tenant from authenticated user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) throw new Error("Not authenticated");

          // Get user record from users table
          const { data: users, error: usersError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_user_id", user.id)
            .limit(1);

          if (usersError) throw usersError;
          if (!users || users.length === 0) {
            // Fallback to legacy - no multi-entity support
            setEntities([]);
            setIsLoading(false);
            return;
          }

          const dbUser = users[0];

          // Get tenant via tenant_users junction table
          const { data: tenantUsers, error: tuError } = await supabase
            .from("tenant_users")
            .select("tenant_id")
            .eq("user_id", dbUser.id)
            .limit(1);

          if (tuError) throw tuError;

          const tenantUser = tenantUsers?.[0];
          if (!tenantUser?.tenant_id) {
            setEntities([]);
            setIsLoading(false);
            return;
          }

          tenantId = tenantUser.tenant_id;

          // Get tenant details
          const { data: tenants } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", tenantId)
            .limit(1);

          const tenant = tenants?.[0];
          setTenantName(tenant?.name || null);
        }

        // Get ALL entities for this tenant (not just the first one)
        const { data: entitiesData, error: entitiesError } = await supabase
          .from("entities")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("name", { ascending: true });

        if (entitiesError) throw entitiesError;

        const fetchedEntities = entitiesData || [];
        setEntities(fetchedEntities);

        // Restore previously selected entity from localStorage (only in non-demo mode)
        const storedEntityId = !isDemoMode ? localStorage.getItem(STORAGE_KEY) : null;
        const storedEntity = fetchedEntities.find((e) => e.id === storedEntityId);

        if (storedEntity) {
          setSelectedEntityState(storedEntity);
        } else if (fetchedEntities.length > 0) {
          // Default to first entity
          setSelectedEntityState(fetchedEntities[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load entities");
      } finally {
        setIsLoading(false);
      }
    };

    loadEntities();
  }, [supabase]);

  // Persist selected entity to localStorage
  const setSelectedEntity = useCallback((entity: Entity) => {
    setSelectedEntityState(entity);
    localStorage.setItem(STORAGE_KEY, entity.id);
  }, []);

  return (
    <EntityContext.Provider
      value={{
        entities,
        selectedEntity,
        setSelectedEntity,
        isLoading,
        error,
        tenantName,
        isDemo,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export function useEntityContext() {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error("useEntityContext must be used within an EntityProvider");
  }
  return context;
}
