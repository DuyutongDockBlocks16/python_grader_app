<script>
    import { userUuid, currentAssignment } from "../stores/stores.js";
    
    import {onMount, afterUpdate} from "svelte"

    import TopBar from "./TopBar.svelte"

    import CodeMirror from "svelte-codemirror-editor";
    import { python } from "@codemirror/lang-python";
    import { oneDark } from "@codemirror/theme-one-dark";


    let updatedResult = null;
    let eventSource;

    const assignmentNumber = 3;
    let code = "";

    let submissionId = 0;

    let inGrading = 0;
    let progress_width = 0;

    let assignments_completed = $currentAssignment-1;



    onMount(() => {
        
        return () => {
            if(eventSource){
                if (eventSource.readyState === 1) {
                    console.log(submissionId,"sse connection closed (client side)")
                    eventSource.close();
                }
            }
        }
    })



    afterUpdate(() => {
        
        if(eventSource){
            console.log("readyState", eventSource.readyState)
        }
        
        if(submissionId > 0 ){
            if(eventSource && (eventSource.readyState == 1 || eventSource.readyState == 0)){
                if(updatedResult && updatedResult["status"] === "processed"){
                    console.log(submissionId,"code graded, closing sse connection...");
                    console.log(submissionId,"sse connection closed (client side)");
                    eventSource.close();
                }
                return;
            }else{
                if(updatedResult && updatedResult["status"] === "processed"){
                    return;
                }
                eventSource = new EventSource(`/api/sse/${submissionId}`);
                console.log(submissionId,"sse connection open (client side)")
                eventSource.onopen = () => {
                    console.log(submissionId, "sse connection established");
                };
                eventSource.onmessage = (event) => {
                    console.log(submissionId,"sse event received")
                    updatedResult = JSON.parse(event.data);
                    inGrading = 0;
                };

                eventSource.onerror = (event) => {
                    console.log(event);
                };
            }
        }
    } )



    const fetchAssignement = async () => {
        
        if ($currentAssignment > assignmentNumber) {
            return null;
        }
        const response = await fetch(`/api/assignments/${$currentAssignment}`);
        return await response.json();
    };

    let assignmentPromise = fetchAssignement();
    

    const submitAssignment = async (assignmentId) => {
        if (code.length === 0 || inGrading === 1) {
            return;
        }


        const newSubmission = {
            user: $userUuid,
            code: code,
            assignmentId: assignmentId,
        };

        const response = await fetch("/api/submission", {
            method: "POST",
            body: JSON.stringify(newSubmission),
        });

        updatedResult = null;
 

        const res = await response.json();

        if(eventSource){
            if (eventSource.readyState === 1 || eventSource.readyState === 0) {
                console.log(submissionId,"sse connection closed (client side)")
                eventSource.close();
            }
        }

        submissionId = res.submissionId;

        inGrading = 1;

       
    };

    const fetchNextAssignment = async () => {
        $currentAssignment++;
        assignments_completed = $currentAssignment-1;
        progress_width = assignments_completed/assignmentNumber*100;

        
        if(eventSource){
            if (eventSource.readyState === 1 || eventSource.readyState === 0) {
                console.log(submissionId,"sse connection closed (client side)")
                eventSource.close();
            }
        }
        updatedResult = null;
        submissionId = 0;
        code = ""
        assignmentPromise = fetchAssignement();
    };


</script>

<TopBar assignments_completed={assignments_completed}/>

<h1 class="font-mono text-3xl font-bold mb-4">Welcome to your Python course!</h1>

{#await assignmentPromise}
    <div class="text-gray-700">Loading...</div>
{:then assignment}
    {#if assignment == null}
        <div class="mb-5 h-1 bg-gray-200">
            <div class="h-1 bg-purple-500" style="width: {progress_width}%"></div>
        </div>
        <div class="text-green-500">Nice Job! You have completed the course!</div>
    {:else}
        <div class="mb-5 h-1 bg-gray-200">
            <div class="h-1 bg-purple-500" style="width: {progress_width}%"></div>
        </div>
        <div id="assignment" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">Assignment #{$currentAssignment}: {assignment.title}</h2>
            <div class="rounded-t-lg overflow-hidden border-t border-l border-r border-gray-400 p-4">
                <p class="font-mono text-lg text-gray-800 text-center">
                    {assignment.handout}
                </p>
            </div>
            <CodeMirror id="editor"
                bind:value={code}
                lang={python()}
                theme={oneDark}
            />
            <button id="submitbutton"
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed" 
                on:click={() => submitAssignment(assignment.id)} 
                disabled={inGrading === 1}>
                Submit for grading
            </button>
        </div>
        <div>
            <h2 class="text-2xl font-bold mb-4">Test Results</h2>
            {#if updatedResult != null}
                <div id="result">
                    <p class={updatedResult["correct"] ? 'bg-green-200' : 'bg-red-200'}><b>grader_feedback: </b>{updatedResult["graderFeedback"]}</p>
                    <p id="correctness" class={updatedResult["correct"] ? 'bg-green-200' : 'bg-red-200'}><b>{updatedResult["correct"] ? "Passed!": "Not Passed..."}</b></p>
                    {#if $currentAssignment <= assignmentNumber && updatedResult["correct"] == true}
                        <button id="next" class="bg-green-500" on:click={fetchNextAssignment}>
                            Fetch Next Assignment
                        </button> 
                    {/if}     
                </div>
            {/if}
            {#if inGrading === 1}
                <p id="ingrading" class="bg-gray-200">In grading... Please wait</p>
            {/if}
        </div>
        
       
    {/if}
{/await}

<style>

    button {
        @apply text-white px-4 py-2 rounded mt-4;
    }

    p{
        @apply text-gray-800 p-2 rounded mb-2;
    }
</style>
