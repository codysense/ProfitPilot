import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { assetsApi, managementApi } from "../../lib/api";
import toast from "react-hot-toast";
import { ChartAccountSelect } from "../../components/ChartAccountSelect";
import { GenericSearchSelect } from "../../components/GenericSearchCombo";

const recapitalizeSchema = z
  .object({
    assetId: z.string().min(1, "Asset is required"),
    transactionDate: z.string().min(1, "Transaction date is required"),
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be positive"),
    transactionType: z.enum(["CAPITAL_IMPROVEMENT", "RECLASSIFY_EXPENSE"]),
    usefulLifeExtension: z.number().int().min(0).optional(),
    sourceAccountId: z.string().optional(),
  })
  .refine(
    (data) =>
      data.transactionType !== "RECLASSIFY_EXPENSE" || !!data.sourceAccountId,
    {
      message: "Source expense account is required for reclassification",
      path: ["sourceAccountId"],
    },
  );

type RecapitalizeFormData = z.infer<typeof recapitalizeSchema>;

interface RecapitalizeAssetModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RecapitalizeAssetModal = ({
  onClose,
  onSuccess,
}: RecapitalizeAssetModalProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecapitalizeFormData>({
    resolver: zodResolver(recapitalizeSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split("T")[0],
      transactionType: "CAPITAL_IMPROVEMENT",
      usefulLifeExtension: 0,
    },
  });

  const transactionType = watch("transactionType");

  const { data: assets } = useQuery({
    queryKey: ["assets-for-recapitalization"],
    queryFn: () => assetsApi.getAssets({ status: "ACTIVE", limit: 1000 }),
  });
  console.log("Assets for recapitalization:", assets);

  const { data: chartAccounts } = useQuery({
    queryKey: ["chart-accounts-for-recap"],
    queryFn: () => managementApi.getChartOfAccounts(),
  });

  const onSubmit = async (data: RecapitalizeFormData) => {
    try {
      await assetsApi.recapitalizeAsset(data.assetId, data);
      toast.success("Asset recapitalized successfully");
      onSuccess();
    } catch (error) {
      console.error("Recapitalize asset error:", error);
      toast.error("Failed to recapitalize asset");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recapitalize Asset
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Asset *
                </label>

                <GenericSearchSelect
                  data={assets?.assets || []}
                  value={watch("assetId")}
                  onChange={(value) => setValue("assetId", value)}
                  placeholder="Select asset"
                  searchKeys={["assetNo", "name"]}
                  displayValue={(ast) =>
                    ast ? `${ast.assetNo} - ${ast.name}` : ""
                  }
                  renderOption={(ast) =>
                    ast ? `${ast.assetNo} - ${ast.name}` : ""
                  }
                  valueKey={"id"}
                />

                {/* <select
                  {...register("assetId")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select asset</option>
                  {assets?.assets?.map((asset: any) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetNo} - {asset.name}
                    </option>
                  ))}
                </select> */}
                {errors.assetId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.assetId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Transaction Date *
                  </label>
                  <input
                    {...register("transactionDate")}
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.transactionDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.transactionDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount *
                  </label>
                  <input
                    {...register("amount", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Engine overhaul extending service life"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Transaction Type *
                </label>
                <select
                  {...register("transactionType")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="CAPITAL_IMPROVEMENT">
                    Capital Improvement
                  </option>
                  <option value="RECLASSIFY_EXPENSE">
                    Reclassify Existing Expense
                  </option>
                </select>
              </div>

              {/* {transactionType === "RECLASSIFY_EXPENSE" && ( */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Source Account *
                </label>
                <ChartAccountSelect
                  accounts={chartAccounts?.accounts || []}
                  value={watch("sourceAccountId")}
                  onChange={(value) => setValue("sourceAccountId", value)}
                />
                {/* <p className="mt-1 text-xs text-gray-500">
                  The expense account this cost was originally posted to — it
                  will be credited to move the amount onto the asset.
                </p> */}
                {errors.sourceAccountId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.sourceAccountId.message}
                  </p>
                )}
              </div>
              {/* )} */}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Useful Life Extension (Months)
                </label>
                <input
                  {...register("usefulLifeExtension", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave as 0 if this improvement doesn't extend the asset's
                  remaining life.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processing..." : "Recapitalize Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecapitalizeAssetModal;
