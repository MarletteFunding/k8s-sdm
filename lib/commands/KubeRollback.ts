import {
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult,
    Parameter,
    Tags
} from "@atomist/automation-client";
import {rollbackApplication} from "../k8";

@CommandHandler("rollback related resources from Kubernetes cluster", `kube rollback`)
@Tags("rollback", "kubernetes")
export class KubeRollback implements HandleCommand {

    @Parameter({
        displayName: "Name",
        description: "name of resources to rollback",
        pattern: /^[a-z](?:[-a-z0-9]*[a-z0-9])?$/,
        validInput: "a valid Kubernetes resource name, beginning with a lowercase letter, ending with a lowercase" +
            "letter or number, and containing only lowercase letters, numbers and dashes(0)",
        minLength: 1,
        maxLength: 63,
        required: true,
    })
    public name: string;

    @Parameter({
        displayName: "Namespace",
        description: "namespace of resources to remove",
        pattern: /^[a-z](?:[-a-z0-9]*[a-z0-9])?$/,
        validInput: "a valid Kubernetes namespace, beginning with a lowercase letter, ending with a lowercase" +
            "letter or number, and containing only lowercase letters, numbers, and dashes (-)",
        minLength: 1,
        maxLength: 63,
        required: false,
    })
    public ns: string = "default";

    @Parameter({
        displayName: "Port",
        description: "port the application listens on, if not provided no service resources are removed",
        pattern: /^\d{1,5}$/,
        validInput: "a number between 1 and 65535, inclusive",
        minLength: 1,
        maxLength: 5,
        required: false,
    })
    public port: string;

    @Parameter({
        displayName: "Path",
        description: "ingress path for the resource to remove, if not provided no service or ingress " +
            "resources are removed",
        pattern: /^\/\S+$/,
        validInput: "an asbolute URL path, unique for this Kubernetes cluster",
        minLength: 1,
        maxLength: 512,
        required: false,
    })
    public path: string;

    @Parameter({
        displayName: "Host",
        description: "ingress hostname for the resources to remove, if not provided the rule without a host " +
            "is modified",
        pattern: /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*$/,
        validInput: "a valid hostname, each label beginning and ending with a lowercase letter or number and " +
            "containing only lowercase letters, numbers, and dashes (-), separated by periods (.)",
        minLength: 1,
        maxLength: 253,
        required: false,
    })
    public host: string;

    public handle(ctx: HandlerContext): Promise<HandlerResult> {
        const image = this.ns + "/" + this.name;
        return rollbackApplication(image)
            .then(() =>
                ctx.messageClient.respond("Rollback successful"));
    }
}
