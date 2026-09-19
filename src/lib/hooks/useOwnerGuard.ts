import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface UseOwnerGuardOptions {
  ownerId?: string | number | null;
  allowedRole?: string | string[];
  isAuthorized?: boolean | (() => boolean | Promise<boolean>);
  fallbackUrl?: string;
  errorMessage?: string;
  isLoadingResource?: boolean;
}

export function useOwnerGuard({
  ownerId,
  allowedRole,
  isAuthorized,
  fallbackUrl = "/",
  errorMessage = "Akses Ditolak: Anda tidak memiliki wewenang untuk mengakses halaman ini.",
  isLoadingResource = false,
}: UseOwnerGuardOptions) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorizedState, setIsAuthorizedState] = useState(true);

  useEffect(() => {
    if (status === "loading" || isLoadingResource) {
      return;
    }

    if (status === "unauthenticated" || !session?.user) {
      alert("Silakan login terlebih dahulu.");
      router.push("/login");
      return;
    }

    const checkAuth = async () => {
      let authorized = true;

      // 1. Role check
      if (allowedRole) {
        const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
        if (!session.user.role || !roles.includes(session.user.role)) {
          authorized = false;
        }
      }

      // 2. Owner ID check
      if (authorized && ownerId !== undefined && ownerId !== null) {
        const currentUserId = String(session.user.id);
        const targetOwnerId = String(ownerId);
        if (currentUserId !== targetOwnerId) {
          authorized = false;
        }
      }

      // 3. Custom predicate check
      if (authorized && isAuthorized !== undefined) {
        if (typeof isAuthorized === "function") {
          authorized = await isAuthorized();
        } else {
          authorized = isAuthorized;
        }
      }

      if (!authorized) {
        setIsAuthorizedState(false);
        alert(errorMessage);
        if (typeof window !== "undefined" && window.history.length > 2) {
          router.back();
        } else {
          router.replace(fallbackUrl);
        }
      } else {
        setIsAuthorizedState(true);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [session, status, ownerId, isLoadingResource]);

  return {
    isChecking: status === "loading" || isLoadingResource || isChecking,
    isAuthorized: isAuthorizedState,
  };
}
