// agrotrust-az/src/features/passport/hooks/usePassport.ts

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreatePassportPayload,
  CreatePassportResponse,
  Passport,
  VerifyPassportRequest,
  VerifyPassportResponse
} from "../types";
import {
  createPassport,
  verifyPassport,
  listMockPassports
} from "../api/passportApi";

/**
 * React Query hooks for the Passport feature.
 *
 * Goals for MVP:
 * - Keep usage dead simple in page/components
 * - Support mock + function modes transparently
 * - Provide small cache helpers
 */

const QK = {
  passports: ["passport", "list"] as const,
  passportById: (id: string) => ["passport", "byId", id] as const,
  verify: (reqKey: string) => ["passport", "verify", reqKey] as const
};

function makeVerifyKey(req: VerifyPassportRequest) {
  if ("passportId" in req) return `id:${req.passportId}`;
  return `qr:${req.qrData}`;
}

/**
 * List passports (mock store only)
 * Useful for dashboards in demo mode.
 */
export function useMockPassportsList() {
  return useQuery<Passport[]>({
    queryKey: QK.passports,
    queryFn: async () => listMockPassports(),
    staleTime: 5_000
  });
}

/**
 * Verify a passport by id or qrData
 */
export function useVerifyPassport(req?: VerifyPassportRequest, enabled = true) {
  const key = useMemo(() => (req ? makeVerifyKey(req) : "none"), [req]);

  return useQuery<VerifyPassportResponse>({
    queryKey: QK.verify(key),
    queryFn: () => {
      if (!req) {
        return Promise.resolve({
          valid: false,
          issues: [
            {
              code: "passport.request.missing",
              message: "No verification request provided.",
              severity: "low"
            }
          ]
        });
      }
      return verifyPassport(req);
    },
    enabled: Boolean(req) && enabled,
    staleTime: 10_000
  });
}

/**
 * Fetch a passport by id via verify endpoint.
 * This is a practical approach for the MVP without a dedicated "get" endpoint.
 */
export function usePassportById(passportId?: string, enabled = true) {
  const req = passportId ? ({ passportId } as const) : undefined;
  const verifyQuery = useVerifyPassport(req, enabled);

  const passport = verifyQuery.data?.passport ?? null;

  return {
    ...verifyQuery,
    passport
  };
}

/**
 * Create passport mutation
 */
export function useCreatePassport() {
  const qc = useQueryClient();

  return useMutation<CreatePassportResponse, Error, CreatePassportPayload>({
    mutationFn: (payload) => createPassport(payload),
    onSuccess: (data) => {
      // Update single passport cache
      if (data?.passport?.id) {
        qc.setQueryData(QK.passportById(data.passport.id), data.passport);
      }
      // Refresh mock list view (safe in both modes)
      qc.invalidateQueries({ queryKey: QK.passports });
    }
  });
}

/**
 * A small convenience hook bundling common operations.
 */
export function usePassportActions() {
  const create = useCreatePassport();

  const verify = useMutation<VerifyPassportResponse, Error, VerifyPassportRequest>({
    mutationFn: (req) => verifyPassport(req)
  });

  return {
    create,
    verify
  };
}
