pipeline {
    agent any
    
    environment {
        REGISTRY = '192.168.0.101:5000'
        IMAGE_NAME = 'blockapp'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Checking out code from GitHub..."
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                    sh """
                        docker build \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                        -t ${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} \
                        .
                    """
                    echo "✅ Build complete!"
                }
            }
        }
        
        stage('Manual Approval') {
            steps {
                script {
                    echo "⏸️ Waiting for approval..."
                    input message: 'Deploy this build to registry?', ok: 'Approve'
                    echo "✅ Build approved!"
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    echo "📤 Pushing to Docker Registry..."
                    
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:latest"
                    
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:latest"
                    
                    echo "✅ Successfully pushed images to registry!"
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo "🧹 Cleaning up local images..."
                    sh """
                        docker rmi ${IMAGE_NAME}:${BUILD_NUMBER} || true
                        docker rmi ${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} || true
                        docker rmi ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} || true
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo """
            ✅ Pipeline completed!
            
            🌐 View in Registry: http://192.168.0.101:8080
            
            🚀 Deploy:
               cd ~/blockapp
               docker-compose pull && docker-compose up -d
               
            🌐 Access: 
               http://192.168.0.101:71 (Frontend)
               http://192.168.0.101:5001 (Backend)
            """
        }
        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
    }
}