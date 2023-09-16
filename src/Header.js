import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, storage, db } from "./firebase";
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import { FaUserCircle, FaMoon, FaSun } from 'react-icons/fa';



function Header(props) {
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // Adicionado

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark-theme');
        }
    }, [darkMode]);

    function fecharModalCriar() {
        let modal = document.querySelector('.modalCriarConta');
        modal.style.transform = 'scale(1)';

        requestAnimationFrame(() => {
            modal.style.transform = 'scale(0)';
        });

        setTimeout(() => {
            modal.style.display = 'none';
        }, 500);
    }

    function fecharModalUpload() {
        let modal = document.querySelector('.modalUpload');
        modal.style.transform = 'scale(1)';

        requestAnimationFrame(() => {
            modal.style.transform = 'scale(0)';
        });

        setTimeout(() => {
            modal.style.display = 'none';
        }, 500);
    }

    function isValidUsername(username) {
        // Verificar se o nome de usuário está vazio ou só tem espaços em branco
        if (!username || username.trim() === "") {
            return false; // Nome de usuário vazio ou só espaços em branco
        }
    
        // Verificar se o nome de usuário contém espaços
        if (/\s/.test(username)) {
            return false; // Nome de usuário contém espaço, então não é válido
        }
    
        // Converta o nome de usuário para maiúsculas para simplificar a verificação
        const upperCaseUsername = username.toUpperCase();
        
        // Lista de nomes restritos e seus padrões regex
        const restrictedPatterns = [
            /.*ADMIN.*/,
            /.*ADM.*/,
            /.*ADMINISTRADOR.*/
        ];
        
        // Verifique se algum padrão restrito é encontrado no nome de usuário
        for (let pattern of restrictedPatterns) {
            if (pattern.test(upperCaseUsername)) {
                return false; // Encontrado um nome restrito, então não é válido
            }
        }
        
        return true; // Nenhum nome restrito encontrado, sem espaços e não vazio, então é válido
    }
    
    
    function criarConta(e) {
        e.preventDefault();
    
        let email = document.getElementById('email-cadastro').value;
        let username = document.getElementById('username-cadastro').value;
        let senha = document.getElementById('senha-cadastro').value;
    
        if (!email || !senha) {
            toast.error('ADM vê tudo... preencha todas as informações.');
            return;
        }
    
        if (!isValidUsername(username)) {
            toast.error('Quem você pensa que é? o adm? tente outro.');
            return;
        }
    
        createUserWithEmailAndPassword(auth, email, senha)
            .then((authUser) => {
                return updateProfile(authUser.user, {
                    displayName: username
                });
            })
            .then(() => {
                toast.success("Conta criada com sucesso!");
                fecharModalCriar();
            })
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    toast.error('Este email já está em uso. Por favor, tente novamente com um endereço de email diferente.');
                } else {
                    toast.error('Ocorreu um erro. Por favor, tente novamente.');
                }
            });
    }
    
    
    function logar(e) {
        e.preventDefault();
        let email = document.getElementById('email-login').value;
        let senha = document.getElementById('senha-login').value;
    
        signInWithEmailAndPassword(auth, email, senha)
            .then((authResult) => {
                props.setUser(authResult.user.displayName);
                toast.success('Logado com Sucesso!', {
                    className: 'greenToast'
                });
                fecharModalLogin();  // Feche o modal após o login bem-sucedido
            })
            .catch((error) => {
                toast.error('Senha ou email incorretos!', {
                    className: 'redToast'
                });
            });
    }
    



    function abrirModalCriarConta(e) {
        e.preventDefault();
        let modal = document.querySelector('.modalCriarConta');
        modal.style.display = 'block';
        modal.style.transition = 'transform .5s ease, height .2s ease';
        modal.style.transform = 'scale(0)';

        requestAnimationFrame(() => {
            modal.style.transform = 'scale(1)';
        });
    }

    function abrirModalUpload(e) {
        e.preventDefault();
        let modal = document.querySelector('.modalUpload');
        modal.style.display = 'block';
        modal.style.transition = 'transform .5s ease, height .2s ease';
        modal.style.transform = 'scale(0)';

        requestAnimationFrame(() => {
            modal.style.transform = 'scale(1)';
        });
    }

    async function deslogar(e) {
        e.preventDefault();

        const result = await Swal.fire({
            title: 'Você está saindo?',
            text: "Você tem certeza que deseja deslogar?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, deslogar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            auth.signOut().then(() => {
                props.setUser(null);
                window.location.href = "/";
            }).catch((error) => {
                console.error("Error signing out: ", error);
            });
        }
    }

    function uploadPost(e) {
        e.preventDefault();
        setIsUploading(true); // Adicionado

        let tituloPost = document.getElementById('titulo-upload').value;
        const storageRef = ref(storage, `images/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setProgress(progress);
            },
            (error) => {
                toast.error(error.message);
                setIsUploading(false); // Adicionado
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                try {
                    await addDoc(collection(db, 'posts'), {
                        titulo: tituloPost,
                        image: downloadURL,
                        userName: props.user,
                        timestamp: serverTimestamp(),
                    });
                    setProgress(0);
                    setFile(null);
                    document.getElementById('form-upload').reset();
                    fecharModalUpload();
                    setIsUploading(false); // Adicionado
                } catch (error) {
                    toast.error(error.message);
                    setIsUploading(false); // Adicionado
                }
            }
        );
    }
    function abrirModalLogin(e) {
        e.preventDefault();
        let modal = document.querySelector('.modalLogin');
        modal.style.display = 'flex';
        modal.style.transition = 'transform .5s ease, height .2s ease';
        modal.style.transform = 'scale(0)';

        requestAnimationFrame(() => {
            modal.style.transform = 'scale(1)';
        });
    }

    function fecharModalLogin() {
        let modal = document.querySelector('.modalLogin');
        modal.style.transform = 'scale(1)';

        requestAnimationFrame(() => {
            modal.style.transform = 'scale(0)';
        });

        setTimeout(() => {
            modal.style.display = 'none';
        }, 500);
    }
    return (
        <div className="header">
            <ToastContainer />

            {/* Modal de Login */}
            <div className="modalLogin">
                <div className='formLogin'>
                    <div onClick={fecharModalLogin} className='close-modal-criar'>X</div>
                    <h2>Login</h2>
                    <form onSubmit={(e) => logar(e)}>
                        <input id='email-login' type='text' placeholder='Login...' />
                        <input id='senha-login' type='password' placeholder='Senha...' />
                        <input type='submit' name='acao' value='Logar!' />
                        <a onClick={(e) => abrirModalCriarConta(e)} href="#">Criar Conta</a>
                    </form>
                </div>
            </div>
            <div className="modalCriarConta">
                <div className='formCriarConta'>
                    <div onClick={() => fecharModalCriar()} className='close-modal-criar'>X</div>
                    <h2>Criar Conta</h2>
                    <form onSubmit={(e) => criarConta(e)}>
                        <input id='email-cadastro' type='text' placeholder='Seu e-mail...'  />
                        <input id='username-cadastro' type='text' placeholder='Seu username...' />
                        <input id='senha-cadastro' type='password' placeholder='Sua senha...'  />
                        <input type='submit' value="Criar Conta!" />
                    </form>
                </div>
            </div>
            <div className="modalUpload">
                <div className='formUpload'>
                    <div onClick={() => fecharModalUpload()} className='close-modal-criar'>X</div>
                    <h2>Postar</h2>
                    <form id='form-upload' onSubmit={(e) => uploadPost(e)}>
                        <progress id='progress-upload' value={progress}></progress>
                        <input id='titulo-upload' type='text' placeholder='Nome da sua foto...'  required/>
                        <input onChange={(e) => setFile(e.target.files[0])} type='file' name='file' required />
                        <input type='submit' value="Postar" disabled={isUploading} /> {/* Modificado */}
                    </form>
                </div>
            </div>
            <div className='center'>
                <div className='header_logo'>Pan's Code Forum</div>

                {props.user ? (
                    <div className='header_logadoInfo'>
                        <span>Olá, <b>{props.user}</b></span>
                        <a onClick={(e) => abrirModalUpload(e)} href='#'>Postar!</a>
                        <a onClick={(e) => deslogar(e)} href='#'>Deslogar</a>
                        <span className="header_dark" onClick={() => setDarkMode(prev => !prev)}>
                            {darkMode ? <FaSun size={27} /> : <FaMoon size={27} />}
                        </span>
                    </div>
                ) : (
                    <div className="header_icons">
                        <FaUserCircle size={34} onClick={abrirModalLogin} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Header;