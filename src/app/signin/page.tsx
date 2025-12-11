export default function SignInPage() {
    return (
        <div className="bg-[url(/eve-DJydsZc9xrM-unsplash.jpg)] bg-cover bg-center flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
            <div className="bg-white shadow-sm rounded-2xl min-w-lg min-h-96">
                <div className="p-4">
                    <h1 className="text-xl p-8">Welcome to Twilight Cloud</h1>
                    <div className="flex flex-col justify-center">
                        <div className="flex-1">
                            <img src="/undraw_agreement_ftet.svg" alt="Sign In Illustration" className="w-32 h-auto mx-auto" />
                        </div>
                        <div className="w-2/3 text-center mx-auto mt-2 mb-8">
                            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
                        </div>
                    </div>
                    <div className="px-8 pb-8">
                        <button type="button" className="w-full bg-neutral-100 text-black py-2 px-4 rounded-md hover:bg-neutral-200 transition-colors duration-300">
                            Sign in or Sign up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
