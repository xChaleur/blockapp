pipeline {
    agent any
    
    environment {
        REGISTRY = '192.168.0.101:5000'
        IMAGE_NAME = 'blockapp'
        DOCKER_SERVER = 'op1@192.168.0.101'
        TEST_DIR = '~/blockapp'
        PROD_DIR = '~/blockapp-prod'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Checking out code from GitHub..."
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                    env.GIT_COMMIT_MSG = sh(returnStdout: true, script: "git log -1 --pretty=%B").trim()
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Message: ${env.GIT_COMMIT_MSG}"
                    
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
        
        stage('Push to Registry') {
            steps {
                script {
                    echo "📤 Pushing to Docker Registry..."
                    
                    // Tag with build number and commit hash
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:build-${BUILD_NUMBER}"
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT}"
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:latest"
                    
                    // Push all tags
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:build-${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT}"
                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:latest"
                    
                    echo "✅ Successfully pushed to registry!"
                    echo "   - build-${BUILD_NUMBER}"
                    echo "   - ${env.GIT_COMMIT_SHORT}"
                    echo "   - latest (updated)"
                }
            }
        }
        
        stage('Deploy to Test') {
            steps {
                script {
                    echo "🚀 Auto-deploying to TEST environment..."
                    
                    sh """
                        ssh ${DOCKER_SERVER} '
                            cd ${TEST_DIR} && \
                            docker-compose pull && \
                            docker-compose down && \
                            docker-compose up -d && \
                            echo "✅ Test deployment complete!"
                        '
                    """
                    
                    echo """
                    ✅ TEST ENVIRONMENT LIVE!
                    
                    🌐 Test URLs:
                       Frontend: http://192.168.0.101:71
                       Backend:  http://192.168.0.101:5001
                    
                    🧪 Please test thoroughly before promoting to production.
                    """
                }
            }
        }
        
        stage('Promote to Production?') {
            steps {
                script {
                    echo "⏸️ Testing complete. Ready to promote to PRODUCTION..."
                    
                    def promoteInput = input(
                        id: 'PromoteToProd',
                        message: 'Promote build #${BUILD_NUMBER} to PRODUCTION?',
                        parameters: [
                            choice(
                                name: 'Action',
                                choices: ['Approve', 'Reject'],
                                description: 'Deploy to production environment'
                            ),
                            text(
                                name: 'Notes',
                                defaultValue: '',
                                description: 'Deployment notes (optional)'
                            )
                        ]
                    )
                    
                    if (promoteInput['Action'] == 'Approve') {
                        echo "✅ Production deployment approved!"
                        if (promoteInput['Notes']) {
                            echo "📝 Notes: ${promoteInput['Notes']}"
                        }
                        
                        echo """
                        
                        📋 PRODUCTION DEPLOYMENT INSTRUCTIONS:
                        
                        SSH into server:
                            ssh op1@192.168.0.101
                            
                        Deploy to production:
                            cd ~/blockapp-prod
                            docker-compose pull
                            docker-compose down
                            docker-compose up -d
                            
                        Production URLs:
                            Frontend: http://192.168.0.101:73
                            Backend:  http://192.168.0.101:5003
                        
                        Or run this one-liner:
                            ssh op1@192.168.0.101 'cd ~/blockapp-prod && docker-compose pull && docker-compose down && docker-compose up -d'
                        """
                        
                    } else {
                        echo "❌ Production deployment rejected"
                        echo "Build remains in test environment only"
                    }
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
                        docker rmi ${REGISTRY}/${IMAGE_NAME}:build-${BUILD_NUMBER} || true
                        docker rmi ${REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT_SHORT} || true
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo """
            ✅ ==========================================
            ✅ PIPELINE COMPLETED SUCCESSFULLY!
            ✅ ==========================================
            
            📦 Image: ${IMAGE_NAME}:${BUILD_NUMBER}
            🔖 Commit: ${env.GIT_COMMIT_SHORT}
            
            🧪 TEST Environment (LIVE):
               http://192.168.0.101:71
               http://192.168.0.101:5001
            
            🌐 Registry UI:
               http://192.168.0.101:8080
            
            ==========================================
            """
        }
        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
        always {
            sh 'docker system prune -f || true'
        }
    }
}