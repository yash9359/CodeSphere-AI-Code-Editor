import { scanTemplateDirectory } from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import path from "path";
import { NextRequest } from "next/server";

// In-memory cache to avoid re-scanning filesystem on every request
const templateCache = new Map<string, any>();


// Helper function to ensure valid JSON
function validateJsonStructure(data: unknown): boolean {
    try {
        JSON.parse(JSON.stringify(data)); // Ensures it's serializable
        return true;
    } catch (error) {
        console.error("Invalid JSON structure:", error);
        return false;
    }
}


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;

    if (!id) {
        return Response.json({
            error: "Missing playground ID"
        }, {
            status: 400
        });
    }

    const playground = await db.playground.findUnique({
        where: { id }
    });

    if (!playground) {
        return Response.json({
            error: "Playground not found"
        }, {
            status: 404
        });
    }

    const templateKey = playground.template as keyof typeof templatePaths;
    const templatePath = templatePaths[templateKey];

    if (!templatePath) {
        return Response.json({
            error: "Invalid template"
        }, { status: 404 });
    }

    // Return cached template structure if available (instant response)
    if (templateCache.has(templateKey)) {
        return Response.json({
            success: true,
            templateJson: templateCache.get(templateKey)
        }, { status: 200 });
    }

    try {
        const inputPath = path.join(process.cwd(), templatePath);
        const result = await scanTemplateDirectory(inputPath);

        if (!validateJsonStructure(result.items)) {
            return Response.json({
                error: "Invalid JSON structure"
            }, {
                status: 500
            });
        }

        templateCache.set(templateKey, result);

        return Response.json({
            success: true,
            templateJson: result
        }, {
            status: 200
        });
    } catch (error) {
        console.error("Error generating template JSON:", error);
        return Response.json({ error: "Failed to generate template" }, { status: 500 });
    }






}